/**
 * Created by @kazaff on 14-3-11.
 */
"use strict";

module.exports = {
    appId: 777
    , token: "777"
    , api: "http://localhost/message_middleware/mock/auth.json"
    , machine: "http://localhost/message_middleware/mock/machine.json"
    , host: "localhost"
    , port: 8080
    , channel: "/msg"
    ,events: {
        "news-total": "news-total"  //发送指定用户所有未读消息总数
        , "news-list": "news-list"  //发送指定用户的指定类型的指定状态消息列表数据（分页，显示条数）
    }
};