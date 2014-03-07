/**
 * Created by @kazaff on 14-3-7.
 */
"use strict";

var _ = require("underscore");
var Count = 0;

module.exports = {
    poll: function(nodes){

        if(!_.isArray(nodes)){
            throw new Error("parameter 'nodes' must be a Array");
        }

        var validNodes = [];
        for(var i = 0; i < nodes.length; i++){
            if(nodes[i].status){
                var node = _.clone(nodes[i]);
                delete node.status;
                validNodes.push(node);
            }
        }

        if(validNodes.length <= 0){
            throw new Error("valid nodes's number must not be less than 0");
        }

        Count++;
        return validNodes[Count % validNodes.length];
    }
};