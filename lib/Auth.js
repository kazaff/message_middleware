/**
 * Created by @kazaff on 14-3-11.
 */
"use strict";

var Restify = require("restify");
var Crypto = require("crypto");
var _ = require("underscore");

module.exports = {
    verify: function(api, ip, appid, auth, token, cb){

        //生成签名
        var params = this.signature(ip, appid, {auth: auth}, token);

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
    , signature: function(ip, appid, params, token){
        var paramAttr = [];
        paramAttr.push("appId=" + appid);
        paramAttr.push("ip=" + ip);
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
            , hash: Crypto.createHash("md5").update(paramStr + token).digest("hex")
        };
    }
};