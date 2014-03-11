/**
 * Created by @kazaff on 14-3-11.
 */
"use strict";

var Restify = require("restify");
var Crypto = require("crypto");

module.exports = {
    verify: function(api, ip, appid, auth, token, cb){

        //生成签名
        var params = "appId=" + appid + "&auth=" + auth + "&ip=" + ip + "&time=" + (new Date()).getTime();
        var sign = Crypto.createHash("md5").update(params + token).digest("hex");

        //校验
        var client = Restify.createJsonClient({url: api});
        client.get({
            headers: {
                "PARAMS": params + "&sid=" + sign
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
};