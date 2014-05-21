'use strict';

exports.get = function (req, res) {
    var name = req.params.name,
        partial = req.params.partial;

    res.render(partial + '/' + name);
};