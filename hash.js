#!/usr/bin/env node
"use strict";
/*jslint node: true,  stupid: true  */

/* 
   Can count collisions in input file with something like 

   node hash.js | sort | uniq -d | wc -l
*/

var crc = require('crc');
var fs = require('fs');
var crypto = require('crypto');


var main = function () {
    var i, len, words, word, hashCrc32, hashSha, hashSha64, hashSha32, hashSha16, sha;

    //args = process.argv.slice(2);

    words = fs.readFileSync("words-uniq").toString().split(/\r?\n/);

    len = words.length;
    for (i = 0; i < len; i += 1) {
        word = words[i];
        //console.log( word );

        if (word.length >= 2) {
            hashCrc32 = crc.crc32(word).toString(16);

            sha = crypto.createHash('sha1');
            sha.update(word);
            hashSha = sha.digest('hex');

            hashSha64 = hashSha.substring(0, 16);
            hashSha32 = hashSha.substring(0, 8);
            hashSha16 = hashSha.substring(0, 4);

            //console.log(hashCrc32);
            //console.log(hashSha);
            //console.log(hashSha64);
            //console.log(hashSha32);
            console.log(hashSha16);
        }
    }
};


if (require.main === module) {
    main();
}
