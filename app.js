var fs = require('fs'),
    path = require('path'),
    csv = require('csv'),
    express = require('express'),
    compression = require('compression'),
    app = express(),
    parseDate = require('./util').parseDate,
    filter  = require('./filter'),
    summary = require('./summary').summary,
    summarizeBy = require('./summary').summarizeBy,
    csvFile = path.join('static', 'data', 'segpub.csv'),
    incidents = [],
    storeData = csv.transform([].push.bind(incidents));

if(!fs.existsSync(csvFile)){
    console.error('No data found! You probably forgot to run `npm run get-data` to create the file: ', csvFile);
    process.exit(8);
}

storeData.on('finish', function(){
    console.log('The incidents are in memory.');
});

var parser = csv.parse({delimiter: '|', columns: true});
file = fs.createReadStream(csvFile);
file.pipe(parser)
    .pipe(csv.transform(filter.filterByCategory('OCORRÊNCIA')))
    .pipe(storeData)
    .resume();

app.use(compression());

function validatePreconditions(req, res, next){
    if(!req.query.finalKind){
        res.status(412).send({error: 'Final kind missing'});
    }else{
        next();
    }
}

app.get('/incidents', validatePreconditions, function(req, res){
    var finalKind = req.query.finalKind;

    res.set('Content-Type', 'text/csv');
    csv.stringify(
        incidents.filter(filter.filterByKind(finalKind))
                 .filter(filter.filterByDate(req.query.from, req.query.to)),
        {delimiter: '|', header: true})
    .pipe(res);
});

app.get('/incidents/summary', function(req, res){
    function key(incident){
        return incident['Descrição Natureza Final'];
    }
    res.json(
        incidents
            .filter(filter.filterByDate(req.query.from, req.query.to))
            .reduce(summarizeBy(key), {})
    );
});

app.get('/incidents/summary/date', summary(incidents, function(incident){
    var date = parseDate(incident['Inicio Atendimento'].slice(0, 10));
    return date.toISOString().slice(0, 10);
}));

exports.app = app;
