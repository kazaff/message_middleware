/**
 * Created by @kazaff on 14-3-28.
 */
"use strict";

var Who = require("../Notification/who");
Who([1], 1, function(response){
    console.log(response);
});