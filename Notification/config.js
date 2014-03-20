/**
 * Created by @kazaff on 14-3-11.
 */
"use strict";

module.exports = {
    appId: 777
    , token: "777"
    , api: "http://localhost/message_middleware/mock/auth.json"
    , machine: "http://localhost/message_middleware/mock/machine.json"
    , dispatch: "http://localhost:82/"
    , host: "localhost"
    , port: 8080
    , channel: "/msg"
    ,events: {
        "news-total": "news-total"  //发送指定用户所有未读消息总数
        , "news-list": "news-list"  //发送指定用户的指定类型的指定状态消息列表数据（分页，显示条数)
        , "ignore-news": "ignore-news"  //忽略指定类型的所有未读消息
        , "new-info": "new-info"    //查看指定消息详情
        , "remove-new": "remove-new"    //删除指定消息
        , "history-news": "history-news"    //获取指定来源的所有消息（分页）
        , "send": "send"
    }
};