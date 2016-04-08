var os = require('./myos');


var cpuUsage = null;

// cpu usage
os.cpuUsage(function (cpuUsage) {
    cpuUsage = cpuUsage;
});

// cpu核数
var vcores = os.cpus().length;
// cpu频率
var cpuMhz = os.cpus()[0].speed;

// loadAverage in one minutes for single core/CPU
var loadavg = os.loadavg()[0] / vcores;

// 空闲内存
var meminfo = null;
os.memInfo(function (data) {
    meminfo = data;
});

var disk = null;
console.log('要干disk的活了');
// disk,这个方法竟然是同步的！
os.diskinfo('/', function (err, data) {
    disk = data;
});

// gpu
var gpu = os.gpu();


console.log('所有的子进程计算应该开始了。。。');

module.exports = function (callback) {
    console.log('调用probe了');
    callback({
        cpu: {
            vcores: vcores,
            mhz: cpuMhz,
            usage: cpuUsage,
            loadavg: loadavg
        },
        memery: meminfo,
        disk: disk
    });
};
