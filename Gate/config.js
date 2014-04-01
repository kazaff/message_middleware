/**
 * Created by @kazaff on 14-3-6.
 */
"use strict";

module.exports = {
    appId: 6
    , token: "9b4a6888aac3b678faa6bdae3e333438"
    , api: "http://192.168.137.77/wos/public/index.php?rest/V1/auth"
    , host: "192.168.137.77"
    , port: 81
    , servers: [
        {
            protocol: "http"
            ,host: "192.168.137.77"
            , port: 8080
            , status: true
        }
        , {
            protocol: "http"
            ,host: "192.168.137.77"
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
