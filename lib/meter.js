/*
* @Author: cuiyongjian
* @Date:   2016-04-07 23:08:00
* @Last Modified by:   cuiyongjian
* @Last Modified time: 2016-04-19 15:52:57
*/

var http = require('http');
var config = require('../config');
var Q = require('q');
var debug = require('debug')('resourceMeter:meter');

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
                debug(d);
                debug(chunks);
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
        var maxVcore = 0, maxMem =0;
        // 算出节点中最大配置的vcore和mem，放入节点信息中，供physicalWeight算法使用。
        result.forEach(function (item) {
            if(item.memery && item.memery.total > maxMem) {
                maxMem = item.memery.total;
            }
            if (item.cpu && item.cpu.vcores > maxVcore) {
                maxVcore = item.cpu.vcores;
            }
        });
        result.forEach(function (item) {
            item.maxVcore = maxVcore;
            item.maxMem = maxTotalMem;
        });
        debug('所有请求都完成了，看看：', result);
        result = calWeight(result); // 对结果计算权重，结果不排序
        deferred.resolve(result);
    });
    return deferred.promise;
};



// infos格式为如下元素的数组：
// { host: 'xx.xxx.xx.xx', cpu: { vcores: 1, mhz: 2300, loadavg: 0.673828125, usage: '40%' }, memery: { total: 500380, used: 457592, free: 42788, shared: 148, buffers: 10524, cached: 148200, actualFree: 201512, percentUsed: 59.73, comparePercentUsed: '91.45' } }
function calWeight(infos) {
    debug('开始计算calWeight');
    infos = infos.map(function (item) {
        var runtimeLoadValue = runtimeLoad(item);
        var runtimeWeightValue = runtimeWeight(runtimeLoadValue);
        debug('runtimeWeight计算完毕：', runtimeWeightValue);
        var physicalWeightValue = physicalWeight(item);
        var finalWeightValue = finalWeight(runtimeWeightValue, physicalWeightValue);
        return {value: item.host, weight: finalWeightValue};
    });
    debug('calWeight执行完成了', infos);
    return infos;
}


function finalWeight(runtimeV, physicalV) {
    debug('finalWeight计算开始，两个参数：', runtimeV, physicalV);
    var result = Math.round((runtimeV*3 + physicalV*1)/4);
    debug('finalWeightValue计算结束，结果：' + result);
    return result;
}

function runtimeLoad(item) {
    debug('来，runtimeLoad。 进来的值:', item);
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
    debug('runtimeLoad结果：', result);
    return result;
}


function runtimeWeight(loadValue) {
    // 数值越大，节点资源越空闲
    // 将资源负载 [0%-100%] 化为 [10-0]的权重值。 公式为： y=-0.1x+10
    return Math.round(((-0.1 * loadValue) + 10));
}

function physicalWeight(item) {
    debug('physicalWeightValue计算开始：');
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
            memValue = item.memery.total;
            sumW += memW;
        }
    }
    if (config.gpu && item.gpu) {
        // 最简单的算法，有gpu，则gpu权重比就是0.8
        gpuValue = 1;
        sumW += gpuW;
    }
    else {
        gpuValue = 0.8;
        sumW += gpuW;
    }
    debug('physicalWeightValue的cpu信息：', vcoreValue, item.maxVcore,vcoresW);
    debug('physicalWeightValue的内存信息：', memValue,item.maxTotalMem,memW);
    debug('physicalWeightValue的gpu信息', gpuValue,gpuW);
    debug('subW', sumW);
    var result = ((vcoreValue/item.maxVcore*vcoresW + memValue/item.maxTotalMem*memW + gpuValue/1*gpuW)/sumW) * 10;
    debug('result', result);
    result = Math.round(result);
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



