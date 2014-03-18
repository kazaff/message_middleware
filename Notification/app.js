/**
 * Created by @kazaff on 14-3-10.
 */
"use strict";
//todo 处理 uncaughtException
process.on("uncaughtException", function(err){
    try{
        console.log("uncaughtException", err);
        process.exit(1);
    }catch(err){
        console.log("uncaughtException", err.stack);
    }
});
//todo
var d = require("domain").create();
d.on("error", function(err){
    try{
        console.log("Domain err", err);
        process.exit(1);
    }catch(err){
        console.log("Domain err", err.stack);
    }
});
d.run(function(){

    var Config = require("./config");
    var Auth = require("./auth");
    var _ = require("underscore");
    _.str = require("underscore.string");
    var Restify = require("restify");
    var app = Restify.createServer()
        , io = require("socket.io").listen(app)
        , users = {};

    //数据库连接
    var DbConf = require("./dbConf");
    var ODM = require("./model");
    var options = {server: {socketOptions: {keepAlive: 1}}};
    if(DbConf.account != ""){
        options.user = DbConf.account;
    }
    if(DbConf.password != ""){
        options.pass = DbConf.password;
    }
    ODM.db.connect("mongodb://" + DbConf.host + ":" + DbConf.port + "/" + DbConf.database, options);
    //todo 连接数据库错误处理

    io.set("log level", 1);     //关闭debug信息

    //socket认证
    io.set("authorization", function(data, accept){

        //清理多余数据
        delete data.headers;

        //验证请求数据的合法性
        if(_.keys(data.query).length === 2 && _.has(data.query, "auth") && _.has(data.query, "t")){
            Auth.verify(data, Config.appId, Config.api, Config.token, accept);
        }else{
            accept(new Restify.InvalidArgumentError(), false);
        }
    });

    app.use(function(req, res, next){
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

            }catch(err){
                console.log("Domain err", err.stack);
            }
        });

        reqDomain.add(req);
        reqDomain.add(res);

        reqDomain.run(next);
    });
    app.use(Restify.CORS());
    app.use(Restify.fullResponse());
    app.use(Restify.acceptParser(app.acceptable));
    app.use(Restify.bodyParser({mapParams: false}));
    app.use(Restify.dateParser(30));
    app.use(function(req, res, next){   //一定要是短连接，不然会导致Gate服务报错
        res.header("Connection", "Close");
        return next();
    });

    //处理系统发送消息
    app.post("/message", function sendMessage(req, res, next){

        //检查请求参数是否有效
        //console.log(req.body);
        if( _.isUndefined(req.body.message)
            || _.str.trim(req.body.message) == ""
            || _.isUndefined(req.body.to)
            || !_.isArray(req.body.to)){
            return next(new Restify.InvalidArgumentError());
        }

        //检查请求来源是否有效
        var token = req.header("auth");
        if(!token){
            return next(new Restify.UnauthorizedError("authentication required"));
        }

        Auth.machine(Config.machine, Config.appId, token, Config.token, function(err, data){
            if(err){
                return next(err);
            }

            //todo 存数据库

            //todo 消息分发


            res.send({"status": 1});
            return next();
        });
    });

    app.listen(8080, "localhost");

    //绑定频道
    var channel = io.of(Config.channel);
    //连接产生
    channel.on("connection", function(socket){

        //todo 通知集群中其他服务把该用户的连接删除

        users[socket.handshake.user.id] = socket;

        //获取指定用户所有未读消息总数，并推送到客户端
        var newsTotal = {};
        //检查系统消息总数
        ODM.SystemMsg.where({
            uids: {
                "$elemMatch": {
                    id: socket.handshake.user.id
                    , status: 0
                }
            }
        })
            .count(function(err, count){
                if(err){
                    //todo
                }

                newsTotal[0] = count;
                if(_.keys(newsTotal).length === 2){
                    socket.volatile.emit(Config.events["news-total"], newsTotal);
                }
            });
        //检查用户消息总数
        ODM.UserMsg.where({
            to: socket.handshake.user.id
            , uids: {
                "$elemMatch": {
                    id: socket.handshake.user.id
                    , status: 0
                }
            }
        })
            .count(function(err, count){
                if(err){
                    //todo
                }

                newsTotal[1] = count;
                if(_.keys(newsTotal).length === 2){
                    socket.volatile.emit(Config.events["news-total"], newsTotal);
                }
            });

        //消息事件体系
        //获取指定类型的指定状态消息列表数据（分页，显示条数）
        socket.on("news-list", function(data){
            //todo
        });

        //忽略指定类型的所有未读消息（设置已读）
        socket.on("ignore-news", function(data){
            //todo
        });

        //删除指定消息
        socket.on("remove-new", function(data){
            //todo
        });

        //查看指定消息详情
        socket.on("new-info", function(data){
            //todo
        });

        //用户发送消息
        socket.on("send", function(data, cb){

            //检查消息数据完整性
            if(_.keys(data).length === 4 && !_.isUndefined(data.to) && _.isNumber(data.to)){

                //自己不能给自己发消息
                if(data.to == socket.handshake.user.id){
                    return cb({ok: 0, err: new Restify.InvalidArgumentError()});
                }

                //插入数据库
                ODM.UserMsg.create({
                    sid: data.sid
                    , to: data.to
                    , from: socket.handshake.user.id
                    , uids:[
                        {id: data.to, status: 0}
                        , {id: socket.handshake.user.id, status: 1}
                    ]
                    , title: data.title
                    , message: data.message
                }, function(err, result){
                    //回执消息
                    if (err){
                        return cb({ok: 0, err: err});
                    };

                    cb({ok: 1});
                });

                //查找目标用户是否在线
                if(_.isUndefined(users[data.to])){
                    //todo 消息分发

                }else{
                    users[data.to].volatile.emit(Config.events["news-total"], {0: 0, 1: 1});
                }
            }else{
                //回执消息
                cb({ok: 0, err: new Restify.InvalidArgumentError()});
            }
        });

        //连接注销 或 心跳失败后做处理
        socket.on("disconnect", function(){
            //删除断开连接的用户socket
            users[socket.handshake.user.id] = null;
            delete users[socket.handshake.user.id];
        });
    });

});
