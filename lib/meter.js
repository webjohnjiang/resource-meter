/*
* @Author: cuiyongjian
* @Date:   2016-04-07 23:08:00
* @Last Modified by:   cuiyongjian
* @Last Modified time: 2016-04-19 11:25:35
*/

var http = require('http');
var config = require('../config');
var Q = require('q');
var debug = require('resourceMeter:meter');

var pget = function (host, port) {
    var desPort = port || config.port;
    var url = 'http://' + host + ':' + desPort + '/api';
    var deferred = Q.defer();
    var req = http.get(url, function (res) {
        var chunks = [];
        debug('发起了get请求');
        debug(url);
        if (res.statusCode !== 200) {
            deferred.resolve(null);
        }
        else {
            res.on('data', function (d) {
                chunks.push(d);
            });
            res.on('end', function (d) {
                debug('拿到了get数据');
                var rel = Buffer.concat(chunks);
                rel = JSON.parse(rel.toString());
                debug(rel);
                rel.host = host;
                return deferred.resolve(rel);
            });
        }
    });
    req.on('error', function () {
        deferred.resolve(null);
    });
    return deferred.promise;
}



module.exports = function (input, port) {
    var deferred = Q.defer();
    var pros = [];
    for (var i = 0, len = input.length; i < len; i++) {
        var type = typeof input[i];
        var host;
        if (type === 'string') {
            host = input[i];
        }
        else {
            host = input[i].value;
        }
        pros.push(pget(host, port));
    }
    Q.all(pros).then(function (result) {
        calWeight(result); // 对结果计算权重，结果不排序
        deferred.resolve(result);
    });
    return deferred.promise;
};



// infos格式为如下元素的数组：
// { host: 'xx.xxx.xx.xx', cpu: { vcores: 1, mhz: 2300, loadavg: 0.673828125, usage: '40%' }, memery: { total: 500380, used: 457592, free: 42788, shared: 148, buffers: 10524, cached: 148200, actualFree: 201512, percentUsed: 59.73, comparePercentUsed: '91.45' } }
function calWeight(infos) {
    infos.map(function (item) {
        var runtimeLoadValue = runtimeLoad(item);
        var runtimeWeightValue = runtimeWeight(runtimeWeightValue);
        var physicalWeightValue = physicalWeight(item);
        var finalWeightValue = finalWeight(runtimeWeightValue, physicalWeightValue);
        return {value: item.host, weight: finalWeightValue};
    });
    return infos;
}


function finalWeight(runtimeV, physicalV) {
    return (runtimeV*3 + physicalV*1)/4;
}

function runtimeLoad(item) {
    // 数值越大，负载越重
    var sumW = 0;
    var loadAvgW = 2, cpuUsageW = 1, memUsageW = 1, diskUsageW = 1;
    var loadAvgPercentage = 0, cpuUsagePercentage = 0, memUsagePercentage = 0
    , diskUsagePercentage = 0;
    if (config.cpu && item.cpu) {
        if (item.cpu.loadavg) {
            sumW += loadAvgW;
            loadAvgPercentage = processCPULoadAvg(item.cpu.loadavg);
        }
        if (item.cpu.usage) {
            sumW += cpuUsageW;
            cpuUsagePercentage = item.cpu.usage;
        }
    }
    if (config.memery && item.memery) {
        if (item.memery.percentUsed) {
            sumW += memUsageW;
            memUsagePercentage = item.memery.percentUsed;
        }
    }
    if (config.disk && item.disk.available && item.disk.total) {
        sumW += diskUsageW;
        // 磁盘的total是字节单位， memery的total是KB单位。。。
        diskUsagePercentage = (1 - (item.disk.available/item.disk.total))*100;
    }
    var result = (loadAvgPercentage*loadAvgW + cpuUsagePercentage*cpuUsageW + memUsagePercentage*memUsageW + diskUsagePercentage*diskUsageW) / sumW;
    return result;
}


function runtimeWeight(loadValue) {
    // 数值越大，节点资源越空闲
    // 将资源负载 [0%-100%] 化为 [10-0]的权重值。 公式为： y=-0.1x+10
    return ((-0.1 * loadValue) + 10);
}

function physicalWeight(item) {
    // 数值越大，节点配置越高，资源越好
    var sumW = 0;
    var vcoresW = 3, memW = 2, gpuW = 2;
    var vcoreValue = 0, memValue = 0, gpuValue = 0;
    var maxVcoreValue = 32, maxMemValue = 32, maxGpuValue = 1;
    if (config.cpu && item.cpu) {
        if (item.cpu.vcores) {
            vcoreValue = item.cpu.vcores;
            sumW += vcoresW;
        }
    }
    if (config.memery && item.memery) {
        if (item.memery.total) {
            // 这里内存的total是KB为单位
            memValue = item.memery.total / 1024;
            sumW += memW;
        }
    }
    if (config.gpu && item.gpu) {
        // 最简单的算法，有gpu，则gpu权重比就是0.8
        gpuValue = 0.8;
        sumW += gpuW;
    }

    var result = ((vcoreValue/maxVcoreValue)*vcoresW + (memValue/maxMemValue)*memW + (gpuValue/maxGpuValue)*gpuW)/sumW;
    result = result * 10;
    return result > 10 ? 10 : result;
}



// 处理loadAvg数值为百分比
var processCPULoadAvg = function (value) {
    // 根据loadAvg实际效应，在[0-1]的时候变化影响较大，大于1的时候基本上处于高负载状态。
    if (value > 0 && value <=1) {
        // 映射为 [0%-80%]，公式 y = 80x
        return 80*value;

    }
    else if (value > 1) {
        if (value > 5) {
            return 100;
        }
        // 映射为 [80% - 100%]， 公式 y = 5x + 75
        return ((5 * value) + 75);
    }
    else {
        throw Error('loadAvg数值有误！');
    }
}



