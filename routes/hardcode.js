/* GET users listing. */

var collection = require('../lib/monk');

exports.get = function (req, res) {
        var url = getRandomPage(6);
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
};

/**
 * Получить рандомную строку длинной length. Это будет УРЛ документа
 * @param length
 * @returns {string}
 */
function getRandomPage(length){
        var possible = 'abcdefghijklmnopqrstuvwxyz';
        var randPage = '';
        for (var i = length; i--;)
                randPage += possible.charAt(Math.floor(Math.random() * possible.length));
        return randPage;
}