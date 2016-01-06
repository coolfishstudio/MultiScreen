var express = require('express'),
    app = express(),
    path = require('path');

var port = 9302;
var host = 'http://192.168.1.101:9302/';

var helper = require('./server/helper');

//静态文件存放位置
app.use(express.static(path.join(__dirname, 'client'), {maxAge: 86400000}));


app.get('/qr/:id', function (req, res, next) {
    helper.stringToQRCode(host + '?r=' + req.params.id, function (error, qrImg) {
        qrImg.pipe(res);
    });
});

//启动页面
app.use(function (req, res) {
    helper.gotoView(req, res);
});
var io = require('socket.io').listen(
    app.listen(port, function () {
        console.log('项目已经启动, 端口号为' + port);
}));

//逻辑
var rooms = {};

//有人链接
io.sockets.on('connection', function (socket) {
    //初始化
    socket.on('init', function (obj) {
        var screenID = helper.getCookie('screenID', socket.handshake.headers.cookie);
        if (obj.type === 'show') {
            if (rooms[screenID]) {
                rooms[screenID].socket = socket;
            } else {
                rooms[screenID] = {
                    socket: socket,
                    users: [],
                    data: []
                };//一个屏幕一个房间
            }
            console.log('[创建新屏幕]屏幕ID:', screenID);
            getScreen(screenID, 'createScreenQrcode', {screenID: screenID});
        } else if (obj.type === 'handle') {
            rooms[screenID].users.push(socket);
            console.log('[新玩家接入]玩家ID:', socket.id);
            getScreen(screenID, 'createHandle', {id: socket.id});
        }
    });
    //手柄的触发事件
    socket.on('action', function (obj) {
        var screenID = helper.getCookie('screenID', socket.handshake.headers.cookie);
        obj.id = socket.id;
        console.log('[有玩家操作]玩家ID:', socket.id, ', 玩家行为:', obj.action);
        getScreen(screenID, 'action', obj);
    });

    //有人下线
    socket.on('disconnect', function () {
        console.log('>>> disconnect');
    });
});

function getScreen (id, msg, data) {
    rooms[id].socket.emit(msg, data);
}