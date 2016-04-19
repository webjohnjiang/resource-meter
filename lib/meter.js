/*
* @Author: cuiyongjian
* @Date:   2016-04-07 23:08:00
* @Last Modified by:   cuiyongjian
* @Last Modified time: 2016-04-19 10:08:07
*/

var http = require('http');
var config = require('../config');
var Q = require('q');


var pget = function (host, port) {
    var desPort = port || config.port;
    var url = 'http://' + host + ':' + desPort + '/api';
    var deferred = Q.defer();
    var req = http.get(url, function (res) {
        var chunks = [];
        console.log('来了');
        if (res.statusCode !== 200) {
            deferred.resolve(null);
        }
        else {
            res.on('data', function (d) {
                chunks.push(d);
            });
            res.on('end', function (d) {
                var rel = Buffer.concat(chunks);
                rel = JSON.parse(rel.toString());
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
    infos.forEach(function (item) {
        var runtimeLoadValue = runtimeLoad(item);
        var
    });
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
            loadAvgPercentage = item.cpu.loadavg;
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
        diskUsagePercentage = 1 - (item.disk.available/item.disk.total);
    }
    var result = (loadAvgPercentage*2 + cpuUsagePercentage + memUsagePercentage + diskUsagePercentage) / sumW;
    return result;
}


function runtimeWeight() {
    // 数值越大，节点资源越空闲

}

function physicalWeight() {
    // 数值越大，节点配置越高

}






