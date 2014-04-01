/**
 * Created by @kazaff on 14-3-11.
 */
"use strict";

var Restify = require("restify");
var Crypto = require("crypto");
var _ = require("underscore");

module.exports = {
    verify: function(api, appId, params, token, cb){

        //生成签名
        var params = this.signature(appId, params, token);

        //校验
        var client = Restify.createJsonClient({url: api});

        client.get({
            headers: {
                "PARAMS": params.source + "&sid=" + params.hash
            }
        }, function(err, req, res, obj){

            if(err){
                return cb(err);
            }

            if(!obj.status || obj.status == 0){
                return cb(new Restify.UnauthorizedError("authentication required"));
            }

            delete obj.status;
            return cb(null, obj);
        });

        return;
    }
    , signature: function(appId, params, token){
        var paramAttr = [];
        paramAttr.push("appId=" + appId);
        paramAttr.push("time=" + (new Date()).getTime());

        _.each(_.keys(params), function(key){
            if(_.isEmpty(params[key])){
                return;
            }
            paramAttr.push(key + "=" + params[key]);
        });

        paramAttr = paramAttr.sort();
        var paramStr = paramAttr.join("&");
        return {
            source: paramStr
            , hash: Crypto.createHash("md5").update(paramStr + "&" + token).digest("hex")
        };
    }
};