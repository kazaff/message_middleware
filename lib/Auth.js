/**
 * Created by @kazaff on 14-3-6.
 */
"use strict";

var Restify = require("restify");
var Crypto = require("crypto");

module.exports = {
    verify: function(request, appid, api, auth, token, cb){
        //获取请求的ip
        var ip;
        var forwardedIpsStr = request.header('x-forwarded-for');
        if (forwardedIpsStr){
            var forwardedIps = forwardedIpsStr.split(',');
            ip = forwardedIps[0];
        }

        if (!ip){
            ip = request.connection.remoteAddress;
        }

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

            //把获取到的用户信息存入请求对象
            delete obj.status;
            request.user = obj;
            return cb();
        });

        return;
    }
};