/**
 * Created by @kazaff on 14-3-6.
 */
"use strict";

module.exports = {
    appId: 777
    , token: "777"
    , api: "http://localhost/message_middleware/mock/auth.json"
    , host: "localhost"
    , port: 81
    , servers: [
        {
            host: "localhost"
            , port: 8080
            , status: true
        }
        ,{
            host: "localhost"
            , port: 8081
            , status: true
        }
    ]
};
