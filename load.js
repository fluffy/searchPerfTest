"use strict";
/*jslint node: true,  stupid: true  */

var cassandra = require('cassandra-driver');
var fs = require('fs');
var crc = require('crc');
var async = require('async');

var startLocation = 0;
var minWordLen = 3;

var totalWords = 0;
var numWrites = 0;
var fd = null;
var client = null;

var bufSize = 1000 * 1000,
    read = 0,
    totalRead = 0,
    buffer = new Buffer(bufSize);
var start = 0, end = 0;
var strBuf = "";

var doConnect;
var fetchNextWord;


var finish = function () {
    console.log("Total word processed = " + totalWords);

    fs.closeSync(fd);

    // do a querry to flush the data 
    client.execute('SELECT * FROM testa WHERE id=3', function (err, result) {
        if (err) {
            console.log("error writing to DB: " + err);
        } else {
            console.log("result=" + JSON.stringify(result));
        }
        client.shutdown();
        process.exit(0);
    });
};


var processWord = function (word, position) {
    var done, hash;

    totalWords += 1;

    hash = crc.crc32(word);
    hash = hash % 2000000000;

    if (totalWords % 2000 === 0) {
        done = 100.0 * position / 65908607;
        console.log("word = <" +  word + "> hash=" + hash
                     + " at " + position + " about " + " at " + totalWords + " " + done.toFixed(1) + '% done');
    }

    client.execute('INSERT INTO testa (id,dest) VALUES (?, ?)', [hash, position], { hints : ['int', 'bigint'] }, function (err, result) {
        if (err) {
            console.log("erro writing to DB: " + err + " " + JSON.stringify(result));
            finish();
        } else {
            //console.log( "db write OK for position " + position );
            numWrites += 1;
            fetchNextWord();
        }
    });
};


var fetchNextWord = function () {
    var word;

    if (numWrites > 50000) {
        // reopen DB
        doConnect();
        return;
    }

    while (true) {
        start = strBuf.indexOf(" ", start);
        end = strBuf.indexOf(" ", start + 1);
        //console.log( "loop s,e=" + start + "," + end );

        if ((end === -1) || (start === -1)) {
            // load some more data
            totalRead += read;

            strBuf = null;
            read = fs.readSync(fd, buffer, 0, bufSize, null);
            if (read === 0) {
                console.log("finish due to end of file");
                finish();
                return;
            }

            strBuf = buffer.toString().toLowerCase().replace(/[\W]/g, ' ');
            start = 0;
            end = 0;
        } else {
            if (start + 1 + totalRead > startLocation) {
                if (end - start > minWordLen) {
                    word = strBuf.substring(start + 1, end);

                    //console.log( "Do word " + word );
                    processWord(word, start + 1 + totalRead);
                    start = end;
                    return;
                }
            }
            start = end;
        }
    }
};


var doConnect = function () {
    numWrites = 0;
    if (client !== null) {
        client.shutdown();
    }
    console.log("Connecting to db ...");
    client = new cassandra.Client({ contactPoints : [ '127.0.0.1' ], keyspace: 'perf1' });
    client.connect(function (err, result) {
        if (err) {
            console.log('Problem connecting to database: ' + err + " " + JSON.stringify(result));
            console.log("finish due error on client");
            finish();
        } else {
            console.log('   Connected ');
            fetchNextWord();
        }
    });
};


var main = function () {
    fd = fs.openSync("words", 'r');
    doConnect();
};


if (require.main === module) {
    main();
}
