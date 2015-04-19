"use strict";

var cassandra = require('cassandra-driver');
var async = require('async');
var crc = require('crc');

var client;

var finish = function (e) {
    client.shutdown();
    process.exit(e);
};


var main = function () {
    var args, s = [], i, word, hash;

    args = process.argv.slice(2);
    console.log("Setting up DB ...");
    client = new cassandra.Client({ contactPoints : [ '127.0.0.1' ], keyspace: 'perf1' });

    word = args[0];
    hash = crc.crc32(word);
    hash = hash % 2000000000;

    // make real hash plus a 1000 fake hash to simulate 1000 keys 
    for (i = 0; i < 1000; i = i + 1) {
        s.push(hash + i);
    }

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
        // do querry  
        function (callback) {
            console.time("DB-Query-first");
            console.time("DB-Query-last");
            client.eachRow('SELECT dest FROM testa WHERE id IN ?;', [ s ], { prepare: true }, function (row, result) {
                //console.log('DB row result =  ' + JSON.stringify(result));
                if ( row === 0 ) {
                    console.timeEnd("DB-Query-first");
                }
                console.log("row[" + row + "] = " + result.dest.low);
            }, function (err, result) {
                if (err) {
                    console.log("error querring DB: " + err + " " + result);
                    finish(-1);
                } else {
                    //console.log('DB result =  ' + JSON.stringify(result));
                    console.timeEnd("DB-Query-last");
                    callback(null);
                }
            });
        },
        // end
        function (callback) {
            finish(0);
            callback(null);
        }
    ]);
};


if (require.main === module) {
    main();
}

