/**
 * Created by @kazaff on 14-3-28.
 */
"use strict";

var Config = require("./config");
var _ = require("underscore");
var Restify = require("restify");
var rest = Restify.createJSONClient({
    retry: false
    , headers: {
        "AUTH": "MD " + Config.token
    }
});

function who(ids, type, cb){
    if(!_.isArray(ids) || [0,1].indexOf(parseInt(type)) === -1){
        //todo

        return cb({ok: 0, err: new Restify.InvalidArgumentError()});
    }

    if(ids.length === 0){
        return cb([]);
    }

    rest.get(Config.who + "/users/1,2,3,4", function(err, req, res, obj){
        console.log(res);

        if(err){
            //todo

            return cb({ok:0, err: err});
        }

        cb(obj);
    });
}

module = module.exports = who;