/* GET users listing. */

var collection = require('../lib/monk');

exports.get = function (req, res) {
        var url = getRandomPage();
        //console.log(req.route);

        //console.log(req.originalUrl);
        collection.insert({ userID: '', url: url, code: '' }, function(err, result) {
                if (err) throw err;
                if (result) {
                        res.redirect(url);
                } else {
                        res.status(err || 404);
                        res.render('error', {
                                message: err,
                                error: {}
                        });
                }
        });

                //res.render('hardcode');
};

function getRandomPage(){
        var possible = 'abcdefghijklmnopqrstuvwxyz';
        var randPage = '';
        for (var i = 6; i--;)
                randPage += possible.charAt(Math.floor(Math.random() * possible.length));
        return randPage;
}