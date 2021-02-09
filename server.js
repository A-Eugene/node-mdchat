let express = require('express');
let fs = require('fs');
let app = express();
let server = require('http').Server(app);
let io = require('socket.io')(server);

let db = JSON.parse(fs.readFileSync('./db/db.json'));
let users = JSON.parse(fs.readFileSync('./db/users.json'));

function updateAll() {
	fs.writeFileSync('./db/users.json', JSON.stringify(users, null, 4));
	fs.writeFileSync('./db/db.json', JSON.stringify(db, null, 4));
}

function waitUntil(i) {
	return new Promise(resolve => {
		setInterval(() => {
			if (i) {
				resolve();
			}
		}, 10);
	});
}

function waitTimer(i) {
	return new Promise(resolve => setTimeout(resolve, i));
}

io.on('connection', socket => {
	socket.on('login', (msg, callback) => {
		callback(users[msg.username] == msg.password);
	});

	socket.on('roomlist', (msg, callback) => {
		callback(Object.keys(JSON.parse(fs.readFileSync('./db/db.json'))));
	});

	socket.on('createroom', (msg, callback) => {
		db[msg] = {
			table: [''],
			chat: {},
			online: []
		};
		updateAll();
		callback();
	});

	socket.on('deleteroom', room => {
		delete db[room];
		updateAll();
		console.log(room);
	});

	socket.on('roominit', (room, callback) => {
		room = db[room];
		callback(room.table, room.chat, room.online);
	});

	//Only used for creating/deleting
	socket.on('numberchange', async (room, number) => {
		let length = db[room].table.length;
		let type = '';
		let value = '';

		if (number > length) {
			for (i = length; i < number; i++) {
				db[room].table.push('');
			}
			updateAll();
			type = 'create';
		} else {
			db[room].table.splice(number, length);
			updateAll();
			type = 'delete';
		}
		await waitUntil(type != '');
		io.emit('tablechange', number, type, value);
	});

	socket.on('rowchange', (room, number, value) => {
		db[room].table[number - 1] = value;
		updateAll();
		io.emit('tablechange', number, 'edit', value);
	});

	socket.on('cleartable', room => {
		db[room].table = [''];
		updateAll();
		io.emit('tablechange', 1, 'delete', '');
		io.emit('tablechange', 1, 'edit', '');
	})
});

app.use('/cdn', express.static(__dirname + '/public/cdn'));

app.get('/login', (req, res) => {
	res.status(200).send(fs.readFileSync(__dirname + '/public/login/index.html', 'utf8'));
});

app.get('/rooms', (req, res) => {
	res.status(200).send(fs.readFileSync(__dirname + '/public/rooms/index.html', 'utf8'));
});

app.get('/rooms/:room', (req, res) => {
	let room = req.params.room.replace(/-/g, ' ');

	if (db[room] != undefined) {
		let body = fs.readFileSync('./room/index.html', 'utf8');
		res.send(body);
	} else {
		res.status(404).send(fs.readFileSync(__dirname + '/public/error/index.html', 'utf8'));
	}
});

//If the other routers are all ignored, it means the path is not a real path. Error 404
app.use((req, res) => {
	res.status(404).send(fs.readFileSync(__dirname + '/public/error/index.html', 'utf8'));
});

server.listen(3000);