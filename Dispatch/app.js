/**
 * Created by @kazaff on 14-3-20.
 */
"use strict";

var Cluster = require("cluster");
if(Cluster.isMaster){

    var numCPUs = require("os").cpus().length;
    for(var i = 0; i < numCPUs; i++){
        Cluster.fork();
    }

    Cluster.on("disconnect", function(worker, code, signal){
        console.log("worker %d died (%s). restarting...", worker.process.pid, signal || code);
        Cluster.fork();
    });

}else{      //Worker

    //加载config
    var Config = require("./config");
    var Restify = require("restify");
    var Domain = require("domain");
    var Url = require("url");
    var _ = require("underscore");

    var server = Restify.createServer({name: "Message Dispatch Server"});
    //处理 uncaughtException
    process.on("uncaughtException", function(err){
        console.log("uncaughtException", err);

        try{
            var killTimer = setTimeout(function(){
                process.exit(1);
            }, 30000);
            killTimer.unref();

            server.close();

            if(Cluster.isWorker){
                Cluster.worker.disconnect();
            }

        }catch(err){
            console.log("uncaughtException", err.stack);
        }
    });

    server.use(function(req, res, next){
        var reqDomain = Domain.create();
        reqDomain.on("error", function(err){
            console.log("Domain err", err);

            try{
                res.send(500);

                var killTimer = setTimeout(function(){
                    process.exit(1);
                }, 30000);
                killTimer.unref();

                server.close();

                if(Cluster.isWorker){
                    Cluster.worker.disconnect();
                }

            }catch(err){
                console.log("Domain err", err.stack);
            }
        });

        reqDomain.add(req);
        reqDomain.add(res);

        reqDomain.run(next);
    });

    //开启跨域支持
    server.use(Restify.CORS());
    server.use(Restify.fullResponse());

    server.use(Restify.acceptParser(server.acceptable));
    server.use(Restify.bodyParser({mapParams: false}));
    server.use(Restify.dateParser(30));

    //消息转发
    server.post("/dispatch", function getEntity(req, res, next){
        res.send();
        next();

        var url = Url.parse(req.headers.origin);

        _.each(Config.servers, function(item){
            if(item.status
                && url.protocol != item.protocol
                && url.host != item.host
                && url.port != item.port){

                var client = Restify.createJsonClient({
                    url: item.protocol + "://" + item.host + ":" + item.port
                    , retry: false
                });
                client.post("/dispatch", req.body, function(err, request, response, obj){
                    if(err){
                        //todo
                    }
                });

            }
        });
    });

    server.listen(Config.port, Config.host, function(){
        console.log("%s listening at %s", server.name, server.url);
    });
}