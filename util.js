exports.parseDate = function (dateString){
    var split = dateString.split('/');
    return new Date(split.reverse().join('-'));
};

