var parseDate = require('./util').parseDate;

exports.selector = function(){
    var keys = [].slice.call(arguments);
    return function(record){
        return keys.map(function(key){
            return record[key];
        });
    };
};

var filterBy = function(field, value){
    return function(record){
        var category = record[field];
        if(category === value){
            return record;
        }
    };
};
exports.filterBy = filterBy;

exports.filterByKind = function(value){
    return filterBy('Descrição Natureza Final', value);
};

exports.filterByCategory = function(value){
    return filterBy('Categoria', value);
};

exports.filterByDate = function(from, to){
    return function(incident){
        var date = parseDate(incident['Inicio Atendimento'].slice(0, 10)),
        show = true;
        if(from){
            show = show && date >= new Date(from);
        }
        if(to){
            show = show && date <= new Date(to);
        }
        if(show){
            return incident;
        }
    };
}
