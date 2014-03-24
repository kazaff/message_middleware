/**
 * Created by @kazaff on 14-3-10.
 */
"use strict";

var Log = require("log4js");
Log.configure({
    appenders: [
        {
            type: "console"
        }, {
            type: "file"
            , filename: "../logs/notification/logs.log"
            , pattern: "-yyyy-MM-dd"
            , alwaysIncludePattern: false
            , category: "notification"
        }
    ]
    , replaceConsole: true
}, {});
var logger = Log.getLogger("notification");

//处理 uncaughtException
process.on("uncaughtException", function(err){
    try{
        logger.fatal("uncaughtException" + err.stack);
        process.exit(1);
    }catch(err){
        logger.fatal("uncaughtException" + err.stack);
    }
});

var Domain = require("domain");
var d = Domain.create();
d.on("error", function(err){
    try{
        logger.fatal("[Domain error]" + err.stack);
        process.exit(1);
    }catch(err){
        logger.fatal("[Domain error]" + err.stack);
    }
});
d.run(function(){

    var Config = require("./config");
    var Auth = require("./auth");
    var _ = require("underscore");
    _.str = require("underscore.string");
    var Restify = require("restify");
    var Dispatch = require("./dispatch");
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
    //连接数据库错误处理
    ODM.db.connection.on("error", function(err){
        logger.error(err.stack);
        throw err;
    });

    //io.set("logger", logger);
    io.set("log level", 1);

    //socket认证
    io.set("authorization", function(data, accept){

        //清理多余数据
        delete data.headers;

        //验证请求数据的合法性
        if(_.keys(data.query).length === 2 && _.has(data.query, "auth") && _.has(data.query, "t")){
            Auth.verify(data, Config.appId, Config.api, Config.token, accept);
        }else{
            logger.warn("WebSocket  [InvalidArgumentError] " + JSON.stringify(data.query));
            accept(new Restify.InvalidArgumentError(), false);
        }
    });

    app.use(function(req, res, next){
        var reqDomain = Domain.create();
        reqDomain.on("error", function(err){
            try{
                res.send(500);

                logger.fatal("[Domain error]" + err.stack);

                var killTimer = setTimeout(function(){
                    process.exit(1);
                }, 30000);
                killTimer.unref();

                app.close();

            }catch(err){
                logger.fatal("[Domain error]" + err.stack);
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

    //处理来自消息分发器的消息分发
    app.post("/dispatch", function getDispatch(req, res, next){
        //todo 认证


        //检查参数完整性
        //console.log(req.body);
        if(_.isUndefined(req.body.ids)
            || !_.isArray(req.body.ids)
            || _.isUndefined(req.body.type)
            || !_.isNumber(req.body.type)
            || _.indexOf([0, 1], req.body.type) == -1){

            logger.warn("/dispatch  [InvalidArgumentError] " + JSON.stringify(req.body));
            return next(new Restify.InvalidArgumentError());
        }

        res.send({ok: 1});

        //消息分发
        Dispatch(req.body.ids, users, req.body.type, false, function(err, result){
            if(err){
                logger.error(err.stack);
            }
        });
    });

    //处理系统发送消息
    app.post("/message", function sendMessage(req, res, next){

        //检查请求参数是否有效
        //console.log(req.body);
        if( _.isUndefined(req.body.message)
            || _.str.trim(req.body.message) == ""
            || _.isUndefined(req.body.title)
            || _.str.trim(req.body.title) == ""
            || _.isUndefined(req.body.to)
            || !_.isArray(req.body.to)){

            logger.warn("/message  [InvalidArgumentError] " + JSON.stringify(req.body));
            return next(new Restify.InvalidArgumentError());
        }

        //检查请求来源是否有效
        var token = req.header("auth");
        if(!token){
            logger.warn("/message  [UnauthorizedError] " + JSON.stringify(req.headers));
            return next(new Restify.UnauthorizedError("authentication required"));
        }

        Auth.machine(Config.machine, Config.appId, token, Config.token, function(err, data){
            if(err){
                logger.error(err.stack);
                return next(err);
            }

            //存数据库
            var uids = [];
            _.each(req.body.to, function(item){
                uids.push({id: item});
            });
            ODM.SystemMsg.create({
                sid: data.appId
                , title: req.body.title
                , message: req.body.message
                , uids: uids
            }, function(err, result){
                if(err){
                    logger.error(err.stack);
                    res.send({"status": 0});
                    return next();
                }

                res.send({"status": 1});
                next();

                //todo 异步任务
                Dispatch(req.body.to, users, 0, true, function(err, result){
                    if(err){
                        logger.error(err.stack);
                    }
                });
            });
        });
    });

    app.listen(Config.port, Config.host);

    //绑定频道
    var channel = io.of(Config.channel);
    //连接产生
    channel.on("connection", function(socket){

        //todo 通知集群中其他服务把该用户的连接删除
        //暂时不实现这个功能，因为我们的系统允许单个账号同时多地登录

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
                    logger.error(err.stack);
                    count = 0;
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
                    logger.error(err.stack);
                    count = 0;
                }

                newsTotal[1] = count;
                if(_.keys(newsTotal).length === 2){
                    socket.volatile.emit(Config.events["news-total"], newsTotal);
                }
            });

        //消息事件体系
        //获取指定类型的指定状态消息列表数据（分页，显示条数）
        socket.on(Config.events["news-list"], function(data, cb){
            //检查参数完整性
            if(_.keys(data).length === 4
                && _.isNumber(data.type)
                && _.isNumber(data.status)
                && _.isNumber(data.page)
                && _.isNumber(data.perPage)){

                if(data.type == 0){     //系统类型

                    ODM.SystemMsg.find({
                        uids: {
                            "$elemMatch": {
                                id: socket.handshake.user.id
                                , status: data.status
                            }
                        }
                    })
                        .sort("-time")
                        .select("-uids -message")
                        .skip((data.page - 1) * data.perPage)
                        .limit(data.perPage)
                        .exec(function(err, msgs){
                            if(err){
                                logger.error(err.stack);
                                return cb({ok: 0, err: err});
                            }

                            cb(msgs);
                        });

                }else{      //用户类型

                    ODM.UserMsg.find({
                        to: socket.handshake.user.id
                        , uids: {
                            "$elemMatch": {
                                id: socket.handshake.user.id
                                , status: data.status
                            }
                        }
                    })
                        .sort("-time")
                        .select("-uids -message")
                        .skip((data.page - 1) * data.perPage)
                        .limit(data.perPage)
                        .exec(function(err, msgs){
                            if(err){
                                logger.error(err.stack);
                                return cb({ok: 0, err: err});
                            }

                            cb(msgs);
                        });
                }

            }else{
                cb({ok: 0, err: new Restify.InvalidArgumentError()});
            }
        });

        //忽略指定类型的所有未读消息（设置已读）
        socket.on(Config.events["ignore-news"], function(data, cb){
            //检查参数完整性
            if(_.keys(data).length === 1
                && _.isNumber(data.type)){

                if(data.type == 0){     //系统类型

                    ODM.SystemMsg.update({
                        uids: {
                            "$elemMatch": {
                                id: socket.handshake.user.id
                                , status: 0
                            }
                        }
                    }, {
                        "$set": {
                            "uids.$.status": 1
                        }
                    }, {
                        multi: true
                    }, function(err, numberAffected, raw){
                        if (err){
                            logger.error(err.stack);
                            return cb({ok: 0, err: err});
                        }

                        cb({ok:1, num: -numberAffected});
                    });

                }else{      //用户类型

                    ODM.UserMsg.update({
                        to: socket.handshake.user.id
                        , uids: {
                            "$elemMatch": {
                                id: socket.handshake.user.id
                                , status: 0
                            }
                        }
                    }, {
                        "$set": {
                            "uids.$.status": 1
                        }
                    }, {
                        multi: true
                    }, function(err, numberAffected, raw){
                        if (err){
                            logger.error(err.stack);
                            return cb({ok: 0, err: err});
                        }

                        cb({ok:1, num: -numberAffected});
                    });
                }
            }else{
                cb({ok: 0, err: new Restify.InvalidArgumentError()});
            }
        });

        //删除指定消息
        socket.on(Config.events["remove-new"], function(data, cb){
            //检查参数完整性
            if(_.keys(data).length === 2 && !_.isUndefined(data.id) && _.isNumber(data.type)){

                if(data.type == 0){     //系统消息

                    ODM.SystemMsg.update({
                        _id: data.id
                        , "uids.id": socket.handshake.user.id
                    }, {
                        "$set": {
                            "uids.$.status": -1
                        }
                    }, function(err, numberAffected, raw){

                        if (err){
                            logger.error(err.stack);
                            return cb({ok: 0, err: err});
                        }

                        cb({ok: 1});

                        //尝试删除
                        ODM.SystemMsg.count({
                            _id: data.id
                            , uids: {
                                "$elemMatch": {
                                    status: {"$gte": 0}
                                }
                            }
                        }, function(err, count){

                            if (err){
                                logger.error(err.stack);
                                return;
                            }

                            if(count == 0){
                                ODM.SystemMsg.remove({_id: data.id}, function(err){
                                    if (err){
                                        logger.error(err.stack);
                                        return;
                                    }
                                });
                            }
                        });

                    });

                }else if(data.type == 1){       //用户消息

                    ODM.UserMsg.update({
                        _id: data.id
                        , "uids.id": socket.handshake.user.id
                    }, {
                        "$set": {
                            "uids.$.status": -1
                        }
                    }, function(err, numberAffected, raw){

                        if (err){
                            logger.error(err.stack);
                            return cb({ok: 0, err: err});
                        }

                        cb({ok: 1});

                        //尝试删除
                        ODM.UserMsg.count({
                            _id: data.id
                            , uids: {
                                "$elemMatch": {
                                    status: {"$gte": 0}
                                }
                            }
                        }, function(err, count){

                            if (err){
                                logger.error(err.stack);
                                return;
                            }

                            if(count == 0){
                                ODM.UserMsg.remove({_id: data.id}, function(err){
                                    if (err){
                                        logger.error(err.stack);
                                        return;
                                    }
                                });
                            }
                        });
                    });

                }

            }else{
                //回执消息
                cb({ok: 0, err: new Restify.InvalidArgumentError()});
            }
        });

        //查看指定消息详情
        socket.on(Config.events["new-info"], function(data, cb){

            //检查参数完整性
            if(_.keys(data).length === 2 && !_.isUndefined(data.id) && _.isNumber(data.type)){

                //获取消息信息
                if(data.type == 0){     //系统消息

                    ODM.SystemMsg.findById(data.id, "-uids", function(err, msg){
                        if (err){
                            logger.error(err.stack);
                            return cb({ok: 0, err: err});
                        }

                        cb(msg);

                        //设置该消息为已读
                        ODM.SystemMsg.update({
                            _id: data.id
                            , "uids.id": socket.handshake.user.id
                        }, {
                            "$set": {
                                "uids.$.status": 1
                            }
                        }, function(err, numberAffected, raw){
                            if (err){
                                logger.error(err.stack);
                                return;
                            }

                            //更新未读消息条数
                            socket.volatile.emit(Config.events["news-total"], {0: -1, 1: 0});
                        });
                    });

                }else if(data.type == 1){       //用户消息

                    ODM.UserMsg.findById(data.id, "-to -uids", function(err, msg){
                        if (err){
                            logger.error(err.stack);
                            return cb({ok: 0, err: err});
                        }

                        cb(msg);

                        //设置该消息为已读
                        ODM.UserMsg.update({
                            _id: data.id
                            , "uids.id": socket.handshake.user.id
                        }, {
                            "$set": {
                                "uids.$.status": 1
                            }
                        }, function(err, numberAffected, raw){
                            if (err){
                                logger.error(err.stack);
                                return;
                            }

                            //更新未读消息条数
                            socket.volatile.emit(Config.events["news-total"], {0: 0, 1: -1});
                        });
                    });

                }

            }else{
                //回执消息
                cb({ok: 0, err: new Restify.InvalidArgumentError()});
            }
        });

        //用户发送消息
        socket.on(Config.events["send"], function(data, cb){

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
                        logger.error(err.stack);
                        return cb({ok: 0, err: err});
                    }

                    cb({ok: 1});
                });

                //消息分发
                Dispatch([data.to], users, 1, true, function(err, result){
                    if(err){
                        logger.error(err.stack);
                    }
                });

            }else{
                //回执消息
                cb({ok: 0, err: new Restify.InvalidArgumentError()});
            }
        });

        //查看指定来源的历史消息列表
        socket.on(Config.events["history-news"], function(data,cb){
            //检查参数完整性
            if(_.keys(data).length === 3 && _.isNumber(data.from) && _.isNumber(data.type) && _.isNumber(data.page)){

                if(data.type === 0){    //系统类型

                    ODM.SystemMsg.find({
                        sid: data.from
                        , uids: {
                            "$elemMatch": {
                                id: socket.handshake.user.id
                                , status: {
                                    "$gte": 0
                                }
                            }
                        }
                    })
                        .sort("-time")
                        .select("-uids")
                        .skip((data.page - 1) * 20)
                        .limit(20)
                        .exec(function(err, msgs){
                            if(err){
                                logger.error(err.stack);
                                return cb({ok: 0, err: err});
                            }

                            cb(msgs);

                            if(msgs.length){
                                //若存在未读消息，则设置为已读
                                var ids = [];
                                _.each(msgs, function(item, index, list){
                                    ids.push(item._id);
                                });

                                ODM.SystemMsg.update({
                                    _id: {
                                        "$in": ids
                                    }
                                    , uids: {
                                        "$elemMatch": {
                                            id: socket.handshake.user.id
                                            , status: 0
                                        }
                                    }
                                }, {
                                    "$set": {
                                        "uids.$.status": 1
                                    }
                                }, {
                                    multi: true
                                }, function(err, numberAffected, raw){
                                    if(err){
                                        logger.error(err.stack);
                                        return;
                                    }

                                    if(numberAffected){
                                        //更新未读消息数目
                                        socket.volatile.emit(Config.events["news-total"], {0: -numberAffected, 1: 0});
                                    }
                                });
                            }

                        });

                }else if(data.type === 1){      //用户类型

                    ODM.UserMsg.find({
                        uids: {
                            "$all": [
                                {
                                    "$elemMatch": {
                                        id: socket.handshake.user.id
                                        , status: {
                                            "$ne": -1
                                        }
                                    }
                                }
                                , {
                                    "$elemMatch": {
                                        id: data.from
                                    }
                                }
                            ]
                        }
                    })
                        .sort("-time")
                        .select("-uids")
                        .skip((data.page - 1) * 20)
                        .limit(20)
                        .exec(function(err, msgs){
                            if(err){
                                logger.error(err.stack);
                                return cb({ok: 0, err: err});
                            }

                            cb(msgs);

                            if(msgs.length){
                                //若存在未读消息，则设置为已读
                                var ids = [];
                                _.each(msgs, function(item, index, list){
                                    ids.push(item._id);
                                });

                                ODM.UserMsg.update({
                                    _id: {
                                        "$in": ids
                                    }
                                    , uids: {
                                        "$elemMatch": {
                                            id: socket.handshake.user.id
                                            , status: 0
                                        }
                                    }
                                }, {
                                    "$set": {
                                        "uids.$.status": 1
                                    }
                                }, {
                                    multi: true
                                }, function(err, numberAffected, raw){
                                    if(err){
                                        logger.error(err.stack);
                                        return;
                                    }

                                    if(numberAffected){
                                        //更新未读消息数目
                                        socket.volatile.emit(Config.events["news-total"], {0: 0, 1: -numberAffected});
                                    }
                                });
                            }

                        });
                }
            }
        });

        //连接注销 或 心跳失败后做处理
        socket.on("disconnect", function(){
            //删除断开连接的用户socket
            users[socket.handshake.user.id] = null;
            delete users[socket.handshake.user.id];
            socket = null;
        });
    });
});
