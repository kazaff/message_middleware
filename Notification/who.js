/**
 * Created by @kazaff on 14-3-28.
 */
"use strict";

var Config = require("./config");
var _ = require("underscore");
var Restify = require("restify");
var Auth = require("../lib/Auth");

function who(ids, type, cb){
    if(!_.isArray(ids) || [0,1].indexOf(parseInt(type)) === -1){
        //todo

        return cb({ok: 0, err: new Restify.InvalidArgumentError()});
    }

    if(ids.length === 0){
        return cb([]);
    }

    var params = Auth.signature(0, Config.appId, {auth:"", ids: JSON.stringify(ids)}, Config.token);

    var rest = Restify.createJSONClient({
        retry: false
        , headers: {
            "PARAMS": params.source + "&sid=" + params.hash
        }
    });

    rest.get(Config.who + (type == 0? "/applications" : "/users"), function(err, req, res, obj){

        if(err){
            return cb({ok:0, err: err});
        }

        cb(obj);
    });
}

module = module.exports = who;