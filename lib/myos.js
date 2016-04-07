var os = require('os');
var disk = require('diskusage');


// get disk usage. Takes mount point as first parameter
 os.diskinfo = function (path, callback) {
     disk.check(path, callback);
 };

// 空闲内存精确计算。使用了shell指令。
// 所以对于linux系统，可用于分配的内存不只是free的内存，还包括cached的内存（其实还包括buffers）
// 代码参考自：http://stackoverflow.com/questions/20578095/node-js-get-actual-memory-usage-as-a-percent
os.memInfo = function (callback) {
    var spawn = require("child_process").spawn;
    var prc = spawn("free", []);
    var os = require("os");

    prc.stdout.setEncoding("utf8");
    prc.stdout.on("data", function (data) {
        console.log('我内存计算出现输出了',data);
        var lines = data.toString().split(/\n/g),
            line = lines[1].split(/\s+/),
            total = parseInt(line[1], 10),
            free = parseInt(line[3], 10),
            buffers = parseInt(line[5], 10),
            cached = parseInt(line[6], 10),
            actualFree = free + buffers + cached,
            memory = {
                total: total,
                used: parseInt(line[2], 10),
                free: free,
                shared: parseInt(line[4], 10),
                buffers: buffers,
                cached: cached,
                actualFree: actualFree,
                percentUsed: parseFloat(((1 - (actualFree / total)) * 100).toFixed(2)),
                comparePercentUsed: ((1 - (os.freemem() / os.totalmem())) * 100).toFixed(2)
            };
        callback(memory);
    });

    prc.on("error", function (error) {
        console.log("[ERROR] Free memory process", error);
        throw error;
    });
};

// 获取CPU信息.还没有成功实现。可能需要让目标机器安装cuda，然后执行cuda query程序。
os.gpu = function () {
    var gpu = null
    return {
        name: 'gt630',
        hz: '1000',
        stream: '1000'
    };
    var exec = require('child_process').execSync;
    switch (os.type) {
        case 'Linux':
            gpu = exec('sudo lshw -C display');
            break;
        case 'Darwin':
            gpu = exec('system_profiler | grep GeForce');
            break;
        case 'Windows_NT':
            gup = exec('wmic path win32_VideoController get name');
            break;
    }
    return gpu;
};


// 获取cpu使用率信息
os.cpuUsage = function(callback) {
    //Grab first CPU Measure
    var startMeasure = cpuAverage();

    //Set delay for second Measure
    setTimeout(function() {

      //Grab second Measure
      var endMeasure = cpuAverage();

      //Calculate the difference in idle and total time between the measures
      var idleDifference = endMeasure.idle - startMeasure.idle;
      var totalDifference = endMeasure.total - startMeasure.total;

      //Calculate the average percentage CPU usage
      var percentageCPU = 100 - ~~(100 * idleDifference / totalDifference);

      //Output result to console
      callback(percentageCPU + "% CPU Usage.");
    }, 100);

    //Create function to get CPU information
    function cpuAverage() {
      //Initialise sum of idle and time of cores and fetch CPU info
      var totalIdle = 0, totalTick = 0;
      var cpus = os.cpus();

      //Loop through CPU cores
      for(var i = 0, len = cpus.length; i < len; i++) {

        //Select CPU core
        var cpu = cpus[i];

        //Total up the time in the cores tick
        for(type in cpu.times) {
          totalTick += cpu.times[type];
       }

        //Total up the idle time of the core
        totalIdle += cpu.times.idle;
      }

      //Return the average Idle and Tick times
      return {idle: totalIdle / cpus.length,  total: totalTick / cpus.length};
    }
}

module.exports = os;
