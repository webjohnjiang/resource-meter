var probe = require('./lib/probe');
var meter = require('./lib/meter');



// 资源评价API，连接input内所有目标地址的服务端，获取机器性能权重的列表。
module.exports.meter = meter;


// 探针API.
module.exports.probe = probe;

