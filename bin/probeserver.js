var probe = require('../index').probe;

probe(function (err, data) {
    if (err) {
        console.log(err);
        return;
    }
});
