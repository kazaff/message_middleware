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
    , logMaster: {
        appenders: [{
            type: "logLevelFilter"
            , level: "WARN"
            , appender: {
                type: "multiprocess"
                , mode: "master"
                , loggerHost: this.host
                , loggerPort: this.port + 1000
                , appender: {
                    type: "file"
                    , filename: "../logs/gate/logs.log"
                    , pattern: "-yyyy-MM-dd"
                    , alwaysIncludePattern: false
                }
            }
        }]
    }
    , logWorker: {
        appenders: [{
            type: "logLevelFilter"
            , level: "WARN"
            , appender: {
                type: "multiprocess"
                , mode: "worker"
                , loggerHost: this.host
                , loggerPort: this.port + 1000
            }
        }]
    }
};
