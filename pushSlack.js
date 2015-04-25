#!/usr/bin/env node
"use strict";
/*jslint node: true,  stupid: true  */

var fs = require('fs');
var async = require('async');
var Slack = require('slack-node');

var webHookUri = "https://hooks.slack.com/services/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";


var slack = new Slack();
slack.setWebhook(webHookUri);

var post = function (data,callback) {
    console.log( data );
    /*
curl -X POST --data-urlencode 'payload={"channel": "#lots-of-text", "username": "webhookbot", "text": "message 3"}' https://hooks.slack.com/services/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  
    */

    slack.webhook({
        channel: "#lots-of-text",
        username: "Fluffy Node Bot",
        text: data
    }, function(err, response) {
        if ( err || response.statusCode != 200 ) {
            console.log(response);
        }
        callback();
    });
};

var main = function () {
    var i, len, words, word, hashCrc32, hashSha, hashSha64, hashSha32, hashSha16, sha;

    //args = process.argv.slice(2);

    words = fs.readFileSync("junk").toString().split(/\r?\n/);

    async.eachSeries(words, post, function(err,results){
        if(err){ 
            console.log(err);
        } else {
            console.log('All OK');
        }
    });
   
};


if (require.main === module) {
    main();
}
