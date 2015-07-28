var assert = require('assert'),
    csv = require('csv'),
    filter = require('../filter');

describe('Selector', function(){
    var data;
    beforeEach(function(){
        data = [[1, 2, 3], [4, 5, 6]];
    });
    it('should select only the first element of each tuple', function(){
        var select = filter.selector(0);

        csv.transform(data, select, function(err, output){
            assert.equal(err, null);
            assert.deepEqual(output, [[1], [4]]);
        });
    });
    it('should select the two first element of each tuple', function(){
        var select = filter.selector(0, 1);

        csv.transform(data, select, function(err, output){
            assert.equal(err, null);
            assert.deepEqual(output, [[1, 2], [4, 5]]);
        });
    });
    it('should select the first and the third element of each tuple', function(){
        var select = filter.selector(0, 2);

        csv.transform(data, select, function(err, output){
            assert.equal(err, null);
            assert.deepEqual(output, [[1, 3], [4, 6]]);
        });
    });
});

describe('filterBy', function(){
    it('usage in array context', function(){
        var data = [[0, 0], [42, 0], [0, 42]],
            filterBy = filter.filterBy;
        assert.deepEqual(data.filter(filterBy(0, 42)), [[42, 0]]);
    });
});

describe('filterByKind', function(){
    var fixture, parser;
    beforeEach(function(){
        parser = csv.parse({delimiter: '|', columns: true});
        fixture = require('fs').createReadStream('test/fixture.csv');
    });
    context('with no matches', function(){
        it('should return empty array', function(){
            var byKind = filter.filterByKind('Inexistent Kind');
            fixture.pipe(parser)
                .pipe(csv.transform(byKind, function(err, output){
                    assert.equal(err, null);
                    assert.deepEqual(output, []);
                }));
        });
    });
    context('data with one "Atropelamento"', function(){
        it('should return the mached record', function(){
            var byKind = filter.filterByKind('Atropelamento');
            fixture.pipe(parser)
                .pipe(csv.transform(byKind, function(err, records){
                    var incident = records[0],
                        initialKind = incident['Descrição Natureza Inicial'],
                        finalKind = incident['Descrição Natureza Final'],
                        id = incident['Protocolo'];
                    assert.equal(err, null);
                    assert.equal(records.length, 1);
                    assert.equal(initialKind, 'Atropelamento');
                    assert.equal(finalKind, 'Atropelamento');
                    assert.equal(id, '1211201203254');
                }));
        });
    });
    context('data with one "Cancelado pelo Supervisor"', function(){
        it('should return the all mached record', function(){
            var byKind = filter.filterByKind('Cancelado pelo Supervisor');
            fixture.pipe(parser)
                .pipe(csv.transform(byKind, function(err, records){
                    var initialKinds = records.map(function(v){
                        return v['Descrição Natureza Inicial'];
                    });
                    assert.equal(err, null);
                    assert.deepEqual(initialKinds, [
                        'Pertubação do Trabalho e Sossego',
                        'Informe',
                        'Pertubação do Trabalho e Sossego',
                        'Entorpecente (posse e uso)' ]);
                    assert.equal(records.length, 4);
                }));
        });
    });
    context('data with two "Ameaça", but only one as a final kind', function(){
        var records;
        beforeEach(function(done){
            var byKind = filter.filterByKind('Ameaça');
            fixture.pipe(parser)
                .pipe(csv.transform(byKind, function(err, output){
                    records = output;
                    assert.equal(err, null);
                    done();
                }));
        });
        it('should return only one record', function(){
            assert.equal(records.length, 1);
        });
        it('should return only the one which maches at final kind', function(){
            assert.equal(records[0]['Descrição Natureza Final'], 'Ameaça');
        });
    });
});

describe('filterByCategory', function(){
    var fixture, parser;
    beforeEach(function(){
        parser = csv.parse({delimiter: '|', columns: true});
        fixture = require('fs').createReadStream('test/fixture.csv');
    });
    context('data with 3 "DESISTÊNCIA"', function(){
        var records;
        beforeEach(function(done){
            var byCategory = filter.filterByCategory('DESISTÊNCIA');
            fixture.pipe(parser)
                .pipe(csv.transform(byCategory, function(err, output){
                    records = output;
                    assert.equal(err, null);
                    done();
                }));
        });
        it('should return 3 records', function(){
            assert.equal(records.length, 3);
        });
        it('should return the matched records', function(){
            var idAndCategory = records.map(filter.selector('Protocolo', 'Categoria'));
            assert.deepEqual(idAndCategory, [
                ["2411201203186", "DESISTÊNCIA"],
                ["2911201214451", "DESISTÊNCIA"],
                ["1811201214673", "DESISTÊNCIA"]]);
        });
    });
    context('data with 15 "OCORRÊNCIA"', function(){
        var records;
        beforeEach(function(done){
            var byCategory = filter.filterByCategory('OCORRÊNCIA');
            fixture.pipe(parser)
                .pipe(csv.transform(byCategory, function(err, output){
                    records = output;
                    assert.equal(err, null);
                    done();
                }));
        });
        it('should return 15 records', function(){
            assert.equal(records.length, 15);
        });
        it('should return the matched records', function(){
            var idAndCategory = records.map(filter.selector('Protocolo', 'Categoria')),
                ids = idAndCategory.map(function(record){
                    return record[0];
                }),
                categories = idAndCategory.map(function(record){
                    return record[1];
                });

            assert.ok(categories.every(function(category){return category === 'OCORRÊNCIA';}));
            assert.deepEqual(ids, [
                '611201220313',
                '1111201200982',
                '2111201201002',
                '1211201203254',
                '2811201220897',
                '1411201220431',
                '211201217207',
                '1711201201361',
                '2011201201476',
                '1211201215327',
                '1411201207783',
                '2111201201897',
                '1411201200346',
                '411201203508',
                '2411201218891'
                ]);
        });
    });
});

describe('filterByDate', function(){
    var fixture, parser;
    beforeEach(function(){
        parser = csv.parse({delimiter: '|', columns: true});
        fixture = require('fs').createReadStream('test/fixture.csv');
    });
    context('data with one incident at 2012-11-01', function(){
        var records;
        beforeEach(function(done){
            var from = new Date("2012-11-01"),
                to = new Date("2012-11-01"),
                byDate = filter.filterByDate(from, to);
            fixture.pipe(parser)
                .pipe(csv.transform(byDate, function(err, output){
                    records = output;
                    assert.equal(err, null);
                    done();
                }));
        });
        it('should return 1 records', function(){
            assert.equal(records.length, 1);
        });
        it('should return the matched records', function(){
            var idAndDate = records.map(filter.selector('Protocolo', 'Inicio Atendimento'));
            assert.deepEqual(idAndDate, [["111201200046", "01/11/2012 00:03:26"]]);
        });
    });
    context('data with one incident between 2012-11-26 and 2012-11-28', function(){
        var records;
        beforeEach(function(done){
            var from = new Date("2012-11-26"),
                to = new Date("2012-11-28"),
                byDate = filter.filterByDate(from, to);
            fixture.pipe(parser)
                .pipe(csv.transform(byDate, function(err, output){
                    records = output;
                    assert.equal(err, null);
                    done();
                }));
        });
        it('should return 10 records', function(){
            assert.equal(records.length, 10);
        });
        it('should return the matched records', function(){
            var idAndDate = records.map(filter.selector('Protocolo', 'Inicio Atendimento'));
            assert.deepEqual(idAndDate, [
                 ["2811201207082", "28/11/2012 12:16:57"],
                 ["2611201203668", "26/11/2012 08:53:37"],
                 ["2811201208283", "28/11/2012 13:17:32"],
                 ["2711201218509", "27/11/2012 21:55:30"],
                 ["2811201220897", "28/11/2012 23:55:50"],
                 ["2611201204301", "26/11/2012 09:35:46"],
                 ["2711201213267", "27/11/2012 17:41:40"],
                 ["2711201219042", "27/11/2012 22:26:22"],
                 ["2811201202073", "28/11/2012 06:56:15"],
                 ["2711201210463", "27/11/2012 15:16:56"],
            ]);
        });
    });
});
