/* GET users listing. */
function getRandomPage(){
        var possible = 'abcdefghijklmnopqrstuvwxyz';
        var randPage = '';
        for (var i = 5; i--;)
                randPage += possible.charAt(Math.floor(Math.random() * possible.length));
        return randPage;
}

exports.get = function (req, res) {
        var url = getRandomPage();
        //console.log(req.query);
        res.render('hardcode');
};

exports.post = function (req, res) {

};