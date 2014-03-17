/**
 * Created by @kazaff on 14-3-17.
 */
"use strict";

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

//系统消息
var SystemMsg = mongoose.model("systemMsg", new Schema({
    sid: Number
    , uids: [
        {id: Number, status: {type: Number, default: 0}}
    ]
    , title: String
    , message: String
    , time: {type: Date, default: Date.now}
}));

//用户消息
var UserMsg = mongoose.model("userMsg", new Schema({
    sid: Number
    , to: Number
    , from: Number
    , uids: [
        {id: Number, status: {type: Number, default: 0}}
    ]
    , title: String
    , message: String
    , time: {type: Date, default: Date.now}
}));

//系统公告
var BroadcastMsg = mongoose.model("broadcastMsg", new Schema({
    sid: Number
    , uids: {type: Number, default: 0}
    , title: String
    , message: String
    , time: {type: Date, default: Date.now}
}));

var UserBCMsg = mongoose.model("userBCMsg", new Schema({
    mid: Schema.Types.ObjectId
    , sid: Number
    , uid: Number
    , status: {type: Number, default: 0}
    , time: {type: Date, default: Date.now}
}));

module.exports = {
    db: mongoose
    , SystemMsg: SystemMsg
    , UserMsg: UserMsg
    , BroadcastMsg: BroadcastMsg
    , UserBCMsg: UserBCMsg
};