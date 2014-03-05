/**
 * Created by @kazaff on 14-3-4.
 */
"use strict";

//todo 加载config

//todo 负载算法

var restify = require('restify');
//设置跨域的自定义请求头
restify.CORS.ALLOW_HEADERS.push("auth");

var server = restify.createServer({name: 'Gate Server'});
//开启跨域支持
server.use(restify.CORS());
server.use(restify.fullResponse());

server.use(restify.acceptParser(server.acceptable));
server.use(restify.dateParser(30));

server.use(function auth(req, res, next){
    //验证用户身份
    //console.log(req.header("auth"));
    var token = req.header("auth");
    if(!token){
        return next(new restify.UnauthorizedError("authentication required"));
    }

    //获取用户信息


    return next();
});

server.get('/entity', function getEntity(req, res, next){

    //todo 返回指定node服务地址

    return next();
});

server.listen(81, 'localhost', function(){
    console.log("%s listening at %s", server.name, server.url);
});