/**
 * Created by @kazaff on 14-3-11.
 */
"use strict";

var Auth = require("../lib/Auth");

module.exports = {
    verify: function(socket, appId, api, token, cb){
        //获取请求的ip
        var ip = socket.address.address;

        Auth.verify(api, appId, {type: "user",ip: ip, auth: socket.query.auth}, token, function(err, user){
            if(err){
                return cb(err, false);
            }

            socket.user = user;
            cb(null, true);
        });
    }
    , machine: function(api, appId, params, token, cb){
        params.type = "detail";
        Auth.verify(api, appId, params, token, cb);
    }
};