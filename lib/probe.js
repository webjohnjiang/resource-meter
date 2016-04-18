var os = require('./myos');
var debug = require('debug')('state');
var config = require('../config');

var stateInfo = {};


// cpu核数
if (config.cpu) {
    stateInfo.cpu = {};
    stateInfo.cpu.vcores = os.cpus().length;
    // cpu频率
    stateInfo.cpu.mhz = os.cpus()[0].speed;
}
if (config.disk) {
    // disk,这个方法竟然是同步的！
    os.diskinfo(config.diskDir, function (err, data) {
        stateInfo.disk = data;
    });
}
if (config.gpu) {
    // gpu
    stateInfo.gpu = os.gpu();
}



// 下面是动态的获取的
function reloadInfo(callback) {
    var flag = 0;
    if (config.cpu) {
        // cpu usage 异步 【动态变化的】
        os.cpuUsage(function (result) {
            stateInfo.cpu.usage = result;
            flag++;
            iscallback();
        });
        // loadAverage in one minutes for single core/CPU 【动态变化的】
        stateInfo.cpu.loadavg = os.loadavg()[0] / stateInfo.cpu.vcores;
    }

    if (config.memery) {
        // 空闲内存 【动态变化的】
        os.memInfo(function (data) {
            stateInfo.memery = data;
            flag++;
            iscallback();
        });
    }
    if (!config.memery && !config.cpu) {
        callback();
    }

    function iscallback() {
        if (flag === 2 && config.cpu && config.memery) {
            callback();
        }
        if (flag === 1 && config.cpu && !config.memery) {
            callback();
        }
        if (flag === 1 && !config.cpu && config.memery) {
            callback();
        }
    }
}





module.exports.info = function () {
    if (os.type() !== 'Linux') {
        //throw new Error('本模块暂时不支持非Linux系统（由于loadAverage不支持windows系统,且freeMem计算使用了Linux的free bash命令...）');
        return new Error('模块不支持非Linux系统');
    }
    else {
        return stateInfo;
    }
};

module.exports.start = function (server) {
    reloadInfo(function () {
        server.listen(config.port || process.env.PORT || 8000, function () {
            console.log('server running');
            console.log(server.address());
            console.log('初始化成功，信息：');
            console.log(stateInfo);
            // 每隔一段时间本机自动更新 性能数据信息（是为了远程请求时能够立刻提供给远程客户端）
            setInterval(function () {
                console.time('a');
                reloadInfo(function () {
                    console.log('更新了一次数据，花费时间：');
                    console.timeEnd('a');
                    debug(stateInfo);
                });
            }, 10000);
        });
    });
};





