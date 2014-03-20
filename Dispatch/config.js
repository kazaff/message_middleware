/**
 * Created by @kazaff on 14-3-20.
 */
"use strict";

module.exports = {
    host: "localhost"
    , port: 82
    , servers: [
        {
            protocol: "http"
            ,host: "localhost"
            , port: 8080
            , status: true
        }
        , {
            protocol: "http"
            ,host: "localhost"
            , port: 8081
            , status: false
        }
    ]
};
