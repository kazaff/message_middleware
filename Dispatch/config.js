/**
 * Created by @kazaff on 14-3-20.
 */
"use strict";

module.exports = {
    host: "192.168.137.77"
    , port: 82
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
                    , filename: "../logs/dispatch/logs.log"
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
