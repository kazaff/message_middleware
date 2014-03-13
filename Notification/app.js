/**
 * Created by @kazaff on 14-3-10.
 */
"use strict";

var Config = require("./config");
var Auth = require("./auth");
var Restify = require("restify");
var app = Restify.createServer()
    , io = require("socket.io").listen(app)
    , users = {};

io.set("log level", 1);     //关闭debug信息

//socket认证
io.set("authorization", function(data, accept){
    Auth.verify(data, Config.appId, Config.api, Config.token, accept);
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

    //todo 检查请求参数是否有效
    console.log(req.body);

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

        //todo 发队列

        res.send({"status": 1});
        return next();
    });
});

//处理系统发送公告消息
app.post("/boradcast", function sendBoradcast(req, res, next){

    //todo 检查请求参数是否有效

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

        //todo 发队列

        res.send({"status": 1});
        return next();
    });
});

app.listen(8080, "localhost");

//绑定频道
var channel = io.of(Config.channel);
//连接产生
channel.on("connection", function(socket){

    //console.log(socket.handshake);
    users[socket.handshake.user.id] = socket;

    //todo 消息事件体系
    socket.emit("message", {name:"System", message: "欢迎使用！"});
    socket.on("message", function(data){
        //socket.broadcast.emit("message", data);

        setTimeout(function(){
            console.log("hahah");
        }, 5000);
    });

    //todo 连接注销 或 心跳失败后做处理
    socket.on("disconnect", function(){
        console.log("disconnect");
        //删除断开连接的用户socket
        users[socket.handshake.user.id] = null;
        delete users[socket.handshake.user.id];
    });
});