/**
 * Created by @kazaff on 14-3-10.
 */
"use strict";

var app = require("http").createServer()
    , io = require("socket.io").listen(app);

io.set("log level", 1);     //关闭debug信息

//socket认证
io.set("authorization", function(data, accept){
    //console.log(data.query.auth);
    //todo
    return accept(null, true);
    //return accept("", false);
});

app.listen(8080);

io.sockets.on("connection", function(socket){
    socket.emit("message", {name:"System", message: "欢迎使用！"});
    socket.on("message", function(data){
        socket.broadcast.emit("message", data);
    });
});