var ldb = localStorage;
var socket = io();
var myname = ldb.getItem('login');
var logined = myname != null;
var roomname = location.pathname.replaceAll('/rooms/', '').replaceAll('-', ' ');
var shift = false;

if (logined) {
	$('#overlay').css('display', 'none');
} else {
	location = '/login';
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

function saveAnswer() {
	let text = '';
	for (i = 1; i < $('#table tr').length; i++) {
		text += i + '. ' + $('#table tr').eq(i).children().eq(1).text() + '\n';
	}
	let blob = new Blob([text], { type: 'text/plain'});
	let file = URL.createObjectURL(blob);
	let a = document.createElement('a');
	document.head.innerHTML += a;
	a.style.display = 'none';
	a.href = file;
	a.download = `${roomname} - Answers.txt`;
	a.click();
}

setInterval(() => {
	socket.emit('online', roomname, myname);
}, 1000);

function initialize() {
	socket.emit('online', roomname, myname);

	socket.emit('roominit', roomname, (table, chat, online) => {
		$('#number').val(table.length);
		number = table.length;
		$('table').html(`
			<tr>
				<th>No</th>
				<th>Answers</th>
			</tr>
		`);

		for (i = 0; i < table.length; i++) {
			let html = '';
			html += '<tr>';
				html += `<td>${i + 1}</td>`;
				html += `<td contenteditable tabindex="${i + 1}">${table[i]}</td>`;
			html += '</tr>';

			document.querySelector('#table').innerHTML += html;
		}

		for (bubble of chat) {
			let html = '';
			let { name, message } = bubble;
			let lastchild = $('.bubble').length - 1;

			if (name != $('.bubble div').eq(lastchild).html()) {
				let html = '';
				html += '<div class="bubble">';
					html += `<div>${name}</div>`;
					html += `${message}`;
				html += '</div>';

				document.querySelector('#chat-viewer').innerHTML += html;
			} else {
				document.querySelectorAll('.bubble')[lastchild].innerHTML += `<br>${message}`;
			}

			document.querySelector('#chat-viewer').innerHTML += html;
		}

		editReady();
	});
}

function chatScroll() {
	$('#chat-viewer').scrollTop($('#chat-viewer')[0].scrollHeight);
}

function editReady() {
	$('#table td').unbind();

	$('#table td').on('focus', async e => {
		await waitTimer(100);
		window.tdTarget = e.target;
		window.typeInterval = setInterval(() => {
			socket.emit('rowchange', roomname, $(e.target).attr('tabindex'), $(e.target).html());
		}, 100);
	});

	$('#table td').on('blur', e => {
		delete window.tdTarget;
		clearInterval(window.typeInterval);
		socket.emit('rowchange', roomname, $(e.target).attr('tabindex'), $(e.target).html());
	});

	$('#table td').on('keydown', e => {
		let { target } = e;
		let textNode = target.firstChild;
	});
}

function sendText() {
	if ($('#chatwriter').val().trim() == '') {
		alert("You can't send an empty message");
	} else {
		socket.emit('textChat', roomname, myname, $('#chatwriter').val());
		$('#chatwriter').val('');
	}
}

socket.on('tablechange', (room, number, type, value) => {
	number = parseInt(number);

	if (room == roomname) {
		if (type == 'delete') {
			for (i = $('#table tr').length - 1; i > number; i--) {
				$('#table tr').eq(i).remove();
			}
			$('#number').val($('#table tr').length - 1);
		} else if (type == 'create') {
			for (i = $('#table tr').length; i < number + 1; i++) {
				let html = '';
				html += '<tr>';
					html += `<td>${i}</td>`;
					html += `<td contenteditable tabindex="${i}"></td>`;
				html += '</tr>';

				document.querySelector('#table').innerHTML += html;
			}
			$('#number').val($('#table tr').length - 1);
		} else {
			if ($('#table tr').eq(number).children().eq(1)[0] != document.activeElement) {
				$('#table tr').eq(number).children().eq(1).html(value);
			}
		}

		editReady();
	}
});

socket.on('userlist', (room, list) => {
	if (room == roomname) {
		let html = '';
		for (person of list) {
			if (html == '') {
				html += person;
			} else {
				html += ', ' + person;
			}
		}

		$('#onlines').html(html);
	}
});

socket.on('chat', (room, name, message) => {
		let lastchild = $('.bubble').length - 1;
    if (room == roomname) {
				if (name != $('.bubble div').eq(lastchild).html()) {
					let html = '';
					html += '<div class="bubble">';
						html += `<div>${name}</div>`;
						html += `${message}`;
					html += '</div>';

					document.querySelector('#chat-viewer').innerHTML += html;
				} else {
					document.querySelectorAll('.bubble')[lastchild].innerHTML += `<br>${message}`;
				}

				if (name == myname) {
					chatScroll();
				}
    }
});

socket.on('room-deleted', async (room) => {
	if (room == roomname) {
		await alert('This room has been deleted.');
		location = '/rooms';
	}
})

$('#number').on('change', () => {
	if ($('#number').val() < 1) {
		$('#number').val(1);
	}
	socket.emit('numberchange', roomname, $('#number').val());
});

$('#side-settings span').eq(0).click(saveAnswer);

$('#side-settings span').eq(1).click(() => {
	if (confirm('Are you sure you want to log out?')) {
		ldb.removeItem('login');
		location = '/login';
	}
});

$('#close-side-menu').click(async () => {
	$('#side-menu').css('opacity', '0');
	await waitTimer(400);
	$('#side-menu').css('display', 'none');
});

$('#side-settings').hover(
	() => {
		$('#side-settings > span > label').css('display', 'block');
	},
	() => {
		$('#side-settings > span > label').css('display', 'none');
	}
);

$('#chatwriter').keydown(e => {
	let key = e.originalEvent.key;

	if (!shift && key == 'Enter') {
		e.originalEvent.preventDefault();
		sendText();
	} else if (key == 'Shift') {
		shift = true;
	}
});

$('#chatwriter').keyup(e => {
	let key = e.originalEvent.key;

	if (key == 'Shift') {
		shift = false;
	}
});

window.onbeforeunload = () => {
	socket.emit('offline', roomname, myname);
}

initialize();
