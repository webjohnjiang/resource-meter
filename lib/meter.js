/*
* @Author: cuiyongjian
* @Date:   2016-04-07 23:08:00
* @Last Modified by:   cuiyongjian
* @Last Modified time: 2016-04-18 20:28:08
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
        var host = input[i].value;
        pros.push(pget(host, port));
    }
    Q.all(pros).then(function (result) {
        // calWeight(result);
        deferred.resolve(result);
    });
    return deferred.promise;
};




function calWeight(infos) {

}
