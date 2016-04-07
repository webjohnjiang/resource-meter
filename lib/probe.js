var os = require('./myos');
var osUtil = require('os-utils');

if (os.type() === 'Windows_NT') {
    throw new Error('本模块暂时不支持windows系统（由于loadAverage不支持windows系统）');
}

// cpu核数
var cpucores = os.cpus().length;
// cpu频率
var cpuMhz = os.cpus()[0].speed;

// loadAverage in one minutes for single core/CPU
var loadavg = os.loadavg()[0]/cpucores;

// 空闲内存
var freemem = os.freemem();
// 总内存
var totalmem = os.totalmem();

// gpu
var gpu = os.gpu();

// cpu usage
os.cpuUsage(function (cpuUsage) {
    console.log(cpucores, cpuMhz, loadavg, freemem, totalmem, gpu, cpuUsage);
});

osUtil.cpuFree(function (d)  {
    console.log('util的结果 cpu空闲率');
    console.log(d);
});
osUtil.cpuUsage(function (d)  {
    console.log('util的结果 cpu使用率');
    console.log(d);
});
