/**
 * Created by @kazaff on 14-3-11.
 */
"use strict";

var Auth = require("../lib/Auth");

module.exports = {
    verify: function(socket, appid, api, token, cb){
        //获取请求的ip
        var ip = socket.address.address;

        Auth.verify(api, ip, appid, socket.query.auth, token, function(err, user){
            if(err){
                return cb(err, false);
            }

            socket.user = user;
            cb(null, true);
        });
    }
    , machine: function(api, appid, auth, token, cb){
        Auth.verify(api, 0, appid, auth, token, cb);
    }
};