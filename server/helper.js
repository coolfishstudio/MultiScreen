'use strict';
var qr = require('qr-image');

/**
 * 通过内核 判断类型
 */
module.exports.gotoView = function (req, res) {
    var deviceAgent = req.headers['user-agent'].toLowerCase();
    //只要手机
    var agentID = deviceAgent.match(/(iphone|android)/);
    var screenID = module.exports.getCookie('screenID', req.headers.cookie);

    if (agentID) {
        screenID = req.query.r;
        res.setHeader('Set-Cookie', ['screenID=' + screenID]);
        res.sendfile('./client/handle/index.html');
    } else {
        if (!screenID) {
            screenID = module.exports.generateUUID();
        }
        res.setHeader('Set-Cookie', ['screenID=' + screenID]);
        res.sendfile('./client/show/index.html');
    }
};

/**
 * 生成二维码
 */
module.exports.stringToQRCode = function (string, callback) {
    var qrImg = qr.image(string, {type: 'png', parse_url: true, margin: 1, size: 4});
    callback(null, qrImg);
};

/**
 * 生成唯一标示
 */
module.exports.generateUUID = function (length) {
    var id = '',
        length = length || 32;
    while (length--)
        id += (Math.random() * 16 | 0) % 2 ? (Math.random() * 16 | 0).toString(16) : (Math.random() * 16 | 0).toString(16).toUpperCase();
    return id.toLowerCase();
}

/**
 * 获取指定的cookie
 */
module.exports.getCookie = function (key, strCookie) {
    strCookie += '; ';
    console.log(strCookie);
    var arrCookie = strCookie.split('; ');
    for (var i = 0; i < arrCookie.length; i++) {
        var arr = arrCookie[i].split('=');
        if (key === arr[0]) {
            return arr[1];
        }
    }
    return '';
};