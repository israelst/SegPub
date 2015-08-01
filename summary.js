exports.summarizeBy = function (key){
    return function(summary, curr){
        var _key = key(curr);
        summary[_key] |= 0;
        summary[_key]++;
        return summary;
    };
};
