var os = require("os");
var probe = require('./lib/probe');
var meter = require('./lib/meter');



if (os.type() !== 'Linux') {
    throw new Error('本模块暂时不支持非Linux系统（由于loadAverage不支持windows系统,且freeMem计算使用了Linux的free bash命令...）');
}

// 资源评价API，连接input内所有目标地址的服务端，获取机器性能权重的列表。
module.exports.meter = meter;


// 探针API. 获取的信息会放入callback第二个参数，第一个参数是err。
module.exports.probe = probe;
