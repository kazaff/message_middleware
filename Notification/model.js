/**
 * Created by @kazaff on 14-3-17.
 */
"use strict";

var mongoose = require("mongoose");
var Schema = mongoose.Schema;


var userUid = new Schema({
    id: Number
    , status: {
        type: Number
        , default: 0
    }
}, {_id: false});

//系统消息
var SystemMsg = mongoose.model("systemMsg", new Schema({
    sid: Number
    , time: {type: Date, default: Date.now}
    , uids: [userUid]
    , title: String
    , message: String
}));

//用户消息

var UserMsg = mongoose.model("userMsg", new Schema({
    sid: Number
    , to: Number
    , from: Number
    , uids: [userUid]
    , time: {type: Date, default: Date.now}
    , title: String
    , message: String
}));

module.exports = {
    db: mongoose
    , SystemMsg: SystemMsg
    , UserMsg: UserMsg
};