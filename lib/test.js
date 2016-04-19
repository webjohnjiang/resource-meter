var config = require('../config');
var debug = require('debug')('good');



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


function finalWeight(runtimeV, physicalV) {
    return (runtimeV*3 + physicalV*1)/4;
}


function runtimeWeight(loadValue) {
    debug(loadValue);
    // 数值越大，节点资源越空闲
    // 将资源负载 [0%-100%] 化为 [10-0]的权重值。 公式为： y=-0.1x+10
    return Math.round(((-0.1 * loadValue) + 10));
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
    debug(vcoreValue, item.maxVcore,vcoresW);
    debug(memValue,item.maxTotalMem,memW);
    debug(gpuValue,gpuW);
    debug('subW', sumW);
    var result = ((vcoreValue/item.maxVcore*vcoresW + memValue/item.maxTotalMem*memW + gpuValue/1*gpuW)/sumW) * 10;
    debug('result', result);
    result = Math.round(result);
    return result > 10 ? 10 : result;
}


var testd ='{"host": "x.x.x.x", "maxVcore":1,"maxTotalMem":500380,"cpu":{"vcores":1,"mhz":2300,"loadavg":0.818359375,"usage":30},"disk":{"available":8049090560,"free":9122779136,"total":21002579968},"gpu":{"name":"gt630","hz":"1000","stream":"1000"},"memery":{"total":500380,"used":487060,"free":13320,"shared":148,"buffers":1420,"cached":126640,"actualFree":141380,"percentUsed":71.75,"comparePercentUsed":"97.34"}}';
testd = JSON.parse(testd);

var runtimeLoadValue = runtimeLoad(testd);
var runtimeWeightValue = runtimeWeight(runtimeLoadValue);
debug('runtimeWeightValue', runtimeWeightValue);
var physicalWeightValue = physicalWeight(testd);
debug('physicalWeightValue', physicalWeightValue);
var finalWeightValue = finalWeight(runtimeWeightValue, physicalWeightValue);
debug({value: testd.host, weight: finalWeightValue});
