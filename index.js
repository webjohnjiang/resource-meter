var os = require("./lib/myos");
var probe = require('./lib/probe');



if (os.type() !== 'Linux') {
    throw new Error('本模块暂时不支持非Linux系统（由于loadAverage不支持windows系统,且freeMem计算使用了Linux的free bash命令...）');
}

// 资源评价
module.exports.meter = function () {

};


// 探针接口. 获取的信息会放入callback第二个参数，第一个参数是err。
module.exports.probe = function (callback) {
    probe(callback);
};
