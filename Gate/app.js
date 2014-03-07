/**
 * Created by @kazaff on 14-3-4.
 */
"use strict";

//加载config
var Config = require("./config");
var Restify = require("restify");
var Auth = require("../lib/Auth");
var Balancing = require("../lib/Balancing");

//设置跨域的自定义请求头
Restify.CORS.ALLOW_HEADERS.push("auth");

var server = Restify.createServer({name: "Gate Server"});
//开启跨域支持
server.use(Restify.CORS());
server.use(Restify.fullResponse());

server.use(Restify.acceptParser(server.acceptable));
server.use(Restify.dateParser(30));

//验证用户身份
server.use(function auth(req, res, next){

    var token = req.header("auth");
    if(!token){
        return next(new Restify.UnauthorizedError("authentication required"));
    }

    //获取用户信息
    Auth.verify(req, Config.appId, Config.api, token, Config.token, next);

    return;
});

server.get("/entity", function getEntity(req, res, next){

    //返回指定node服务地址
    var target;
    try{
        target = Balancing.poll(Config.servers);
    }catch(err){
        return next(err);
    }

    res.send(target);
    return next();
});

server.listen(Config.port, Config.host, function(){
    console.log("%s listening at %s", server.name, server.url);
});