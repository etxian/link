"use strict";
cc._RF.push(module, '31784ewxLBBXr7HAZYTnthL', 'vanishFX');
// scripts/vanishFX.js

'use strict';

cc.Class({
    extends: cc.Component,

    properties: {
        anim: {
            default: null,
            type: cc.Animation
        }
    },

    play: function play() {
        this.anim.play('vanish');
    }

    // update (dt) {},
});

cc._RF.pop();