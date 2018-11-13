cc.Class({
    extends: cc.Component,

    properties: {
        anim: {
            default: null,
            type: cc.Animation
        }
    },

    play: function() {
        this.anim.play('vanish')
    },

    // update (dt) {},
});
