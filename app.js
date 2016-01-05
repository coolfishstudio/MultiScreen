var express = require('express'),
    app = express(),
    path = require('path');

var port = 9302;

var validator = require('./server/validator');

//静态文件存放位置
app.use(express.static(path.join(__dirname, 'client'), {maxAge: 86400000}));

//启动页面
app.use(function (req, res) {
    validator.gotoView(req, res);
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
        if (obj.type === 'show') {
            rooms[socket.id] = {
               socket: socket,
               users: [],
               data: []
            };//一个屏幕一个房间
            console.log('[屏幕已启动]屏幕ID:', socket.id);
        } else if (obj.type === 'handle') {
            rooms[obj.screenID].users.push(socket);
            console.log('[新玩家接入]玩家ID:', socket.id);
            getScreen(obj.screenID, 'createHandle', {id: socket.id});
        }
    });
    //手柄的触发事件
    socket.on('action', function (obj) {
        obj.id = socket.id;
        console.log('[有玩家操作]玩家ID:', socket.id, ', 玩家行为:', obj.action);
        getScreen(obj.screenID, 'action', obj);
    });

    //有人下线
    socket.on('disconnect', function () {
        console.log('>>> disconnect');
    });
});

function getScreen (id, msg, data) {
    console.log(id, msg, data);
    rooms[id].socket.emit(msg, data);
}