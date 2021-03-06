/**
 * Created by @kazaff on 14-3-11.
 */
"use strict";

module.exports = {
    appId: 7
    , token: "1c6e8405a8b8edd5c38098d051a83811"
    , api: "http://192.168.137.77/wos/public/index.php?rest/V1/auth"         //验证用户是否有效
    , machine: "http://192.168.137.77/wos/public/index.php?rest/V1/application"  //验证消息发送方（其他系统）是否有效
    , dispatch: "http://192.168.137.77:82/"      //消息分发服务地址
    , who: "http://192.168.137.77/wos/public/index.php?rest/V1"    //获取消息来源信息
    , host: "192.168.137.77"
    , port: 8080
    , channel: "/msg"
    , events: {
        "news-total": "news-total"  //发送指定用户所有未读消息总数
        , "news-list": "news-list"  //发送指定用户的指定类型的指定状态消息列表数据（分页，显示条数)
        , "ignore-news": "ignore-news"  //忽略指定类型的所有未读消息
        , "new-info": "new-info"    //查看指定消息详情
        , "remove-new": "remove-new"    //删除指定消息
        , "history-news": "history-news"    //获取指定来源的所有消息（分页）
        , "send": "send"
    }
};