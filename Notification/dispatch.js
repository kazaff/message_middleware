/**
 * Created by @kazaff on 14-3-20.
 */
"use strict";

var Config = require("./config");
var _ = require("underscore");
var Restify = require("restify");
var rest = Restify.createJSONClient({
    url: Config.dispatch
    , retry: false
});


function dispatch(ids, sockets, type, total, httpFlag, cb){
    var nofound = [];
    var msgTotal = {0: 0, 1: 0};

    if(_.isArray(ids) && _.isNumber(type) && _.indexOf(_.keys(msgTotal), "" + type) != -1){

        msgTotal[type] = total;

        if(ids.length == 0){
            return;
        }

        _.each(ids, function(id){
            if(_.has(sockets, id)){
                _.each(sockets[id], function(item){
                    item.volatile.emit(Config.events["news-total"], msgTotal);
                });
            }else{
                nofound.push(id);
            }
        });

        if(httpFlag && nofound.length){
            rest.post("/dispatch", {ids: nofound, type: type}, function(err, req, res, obj){
                if(err){
                    cb(err);
                }
            });
        }

    }else{
        cb(new Restify.InvalidArgumentError());
    }
}

module = module.exports = dispatch;