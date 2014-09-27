var static = require('node-static'),
	io = require('socket.io'),
	http = require('http'),
	file = new static.Server('./public', { cache: 0 });

var app = http.createServer(function (req, res) {
	file.serve(req, res);
}).listen(3000);

var io = io.listen(app);

io.sockets.on('connection', function (socket) {
	socket.on('message', function(data) {
		socket.broadcast.emit('message', data);
	});
});