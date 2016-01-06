var express = require('express'),
    app = express(),
    path = require('path');

var port = 9302;
var host = 'http://10.10.16.160:9302/';

var helper = require('./server/helper'),
    Player = require('./server/Player');

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
            socket.screenWidth = obj.screenWidth;
            socket.screenHeight = obj.screenHeight;
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
            var player = new Player(10, Math.floor(rooms[screenID].socket.screenWidth * Math.random()), Math.floor(rooms[screenID].socket.screenHeight * Math.random()));
            player.id = socket.id;
            rooms[screenID].users.push(socket);
            rooms[screenID].data.push(player);
            console.log('[新玩家接入]玩家ID:', socket.id);
            getScreen(screenID, 'createHandle', {id: socket.id, player: player, data: rooms[screenID].data});
        }
    });
    //手柄的触发事件
    socket.on('action', function (obj) {
        var screenID = helper.getCookie('screenID', socket.handshake.headers.cookie);
        obj.id = socket.id;
        var list = [];
        for (var i = 0; i < rooms[screenID].data.length; i++) {
            if (rooms[screenID].data[i].id === socket.id) {
                if (obj.action === 'left') {
                    rooms[screenID].data[i].x -= 1;
                }
                if (obj.action === 'right') {
                    rooms[screenID].data[i].x += 1;
                }
                if (obj.action === 'up') {
                    rooms[screenID].data[i].y -= 1;
                }
                if (obj.action === 'down') {
                    rooms[screenID].data[i].y += 1;
                }
                if (obj.action === 'btn_a' && rooms[screenID].data[i].size < 100) {
                    rooms[screenID].data[i].size += 1;
                }
                if (obj.action === 'btn_b' && rooms[screenID].data[i].size > 5) {
                    rooms[screenID].data[i].size -= 1;
                }
            }
        }
        console.log('[有玩家操作]玩家ID:', socket.id, ', 玩家行为:', obj.action);
        getScreen(screenID, 'action', {id: socket.id, action: obj.action, data: rooms[screenID].data});
    });

    //有人下线
    socket.on('disconnect', function () {
        var screenID = helper.getCookie('screenID', socket.handshake.headers.cookie);
        if (!rooms[screenID]) {
            return;
        }
        console.log('[有玩家离开]');
        //从users删除
        for (var i = 0; i < rooms[screenID].users.length; i++) {
            if (rooms[screenID].users[i].id === socket.id) {
                rooms[screenID].users.splice(i, 1);   
            }
        }

        //从data删除
        for (var i = 0; i < rooms[screenID].data.length; i++) {
            if (rooms[screenID].data[i].id === socket.id) {
                rooms[screenID].data.splice(i, 1);    
            }
        }
        getScreen(screenID, 'leaveHandle', {id: socket.id, data: rooms[screenID].data});
    });
});

function getScreen (id, msg, data) {
    rooms[id].socket.emit(msg, data);
}