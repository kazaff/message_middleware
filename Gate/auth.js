/**
 * Created by @kazaff on 14-3-6.
 */
"use strict";

var Auth = require("../lib/Auth");

module.exports = {
    verify: function(request, appid, api, params, token, cb){
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

        params.ip = ip;
        params.type = "user";

        Auth.verify(api, appid, params, token, cb);
    }
};