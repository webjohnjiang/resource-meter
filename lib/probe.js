var os = require('./myos');



// cpu核数
var vcores = os.cpus().length;
// cpu频率
var cpuMhz = os.cpus()[0].speed;

// loadAverage in one minutes for single core/CPU
var loadavg = os.loadavg()[0] / vcores;

// 空闲内存
var meminfo = os.memInfo();

// gpu
var gpu = os.gpu();

var cpuUsage = null;

// cpu usage
os.cpuUsage(function (cpuUsage) {
    console.log('cpu用量回调啦');
    cpuUsage = cpuUsage;
    console.log(cpuUsage);
});


module.exports = function (callback) {
    callback({
        cpu: {
            vcores: vcores,
            mhz: cpuMhz,
            usage: cpuUsage,
            loadavg: loadavg
        }
    });
};
