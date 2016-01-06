function Player (size, x, y) {
    this.size = size || 10;
    this.x = x || 0;
    this.y = y || 0;
    this.color = '#'+('00000'+(Math.random()*0x1000000<<0).toString(16)).slice(-6);
}

module.exports = Player;