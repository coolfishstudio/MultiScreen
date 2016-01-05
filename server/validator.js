module.exports.gotoView = function (req, res) {
    /**
     * 通过内核 判断类型
     */
    var deviceAgent = req.headers['user-agent'].toLowerCase();
    //只要手机
    var agentID = deviceAgent.match(/(iphone|android)/);
    if (agentID) {
        res.sendfile('./client/handle/index.html');
    } else {
        res.sendfile('./client/show/index.html');
    }
};