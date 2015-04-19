"use strict";

var cassandra = require('cassandra-driver');
var async = require('async');

var client;

var recreateTable = true;
//var recreateTable = false;
var firstWrite  =  1;
var totalWrites = 1;


var finish = function (numWrites) {
    console.log("number of writes     = " + numWrites);

    // do a querry to flush the data 
    client.execute('SELECT COUNT(*) FROM testa LIMIT ' + 2 * totalWrites + ';', function (err, result) {
        if (err) {
            console.log("error writing to DB: " + err);
        }
        console.log("result=" + result.rows[0].count.low);

        client.shutdown();
        process.exit(0);
    });
};


var dbWrite = function (numWrites) {

    //var p = (numWrites * numWrites) % 2000000000;
    var p = numWrites * numWrites + 1;

    client.execute('INSERT INTO testa (id,dest) VALUES (?, ?)', [numWrites, p], {  prepare: true, consistency: 1, hints : ['int', 'bigint'] }, function (err) {
        if (err) {
            console.log("erro writing to DB: " + err);
        }

        if (numWrites % 1000 === 0) {
            console.log("db write OK for position " + numWrites);
        }

        if (numWrites >= totalWrites) {
            finish(numWrites);
        } else {
            dbWrite(numWrites + 1);
        }
    });
};



var main = function () {
    console.log("Setting up DB ...");
    client = new cassandra.Client({ contactPoints : [ '127.0.0.1' ], keyspace: 'perf1' });

    async.waterfall([
        // conect to DB
        function (callback) {
            client.connect(function (err) {
                if (err) {
                    console.log('Problem connecting to database: ' + err);
                    console.log("finish due error on client");
                    finish(-1);
                } else {
                    console.log('   Connected to DB');
                }
                callback(null);
            });
        },
        // drop old table 
        function (callback) {
            if (!recreateTable) {
                callback(null);
            } else {
                client.execute('DROP TABLE IF EXISTS testa;', function (err) {
                    if (err) {
                        console.log("erro deleting old table from DB: " + err);
                        finish(-1);
                    } else {
                        console.log('   Deleted old table');
                    }
                    callback(null);
                });
            }
        },
        // create new table 
        function (callback) {
            if (!recreateTable) {
                callback(null);
            } else {
                client.execute('CREATE TABLE testa ( id int, dest bigint, PRIMARY KEY( (id), dest) );', function (err) {
                    if (err) {
                        console.log("error creating table in DB: " + err);
                        finish(-1);
                    } else {
                        console.log('   Created new table');
                    }
                    callback(null);
                });
            }
        },
        // prepare writes  
        function (callback) {
            client.execute('INSERT INTO testa (id,dest) VALUES (?, ?)', [0, 0], { prepare: true, consistency: 1, hints : ['int', 'bigint'] }, function (err) {
                if (err) {
                    console.log("error prepraring insert DB: " + err);
                    finish(-1);
                } else {
                    console.log('   prepared insert');
                }
                callback(null);
            });
        },
        // start writing
        function (callback) {
            dbWrite(firstWrite);
            callback(null);
        }
    ]);
};



if (require.main === module) {
    main();
}

