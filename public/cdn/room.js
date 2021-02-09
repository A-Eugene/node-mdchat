var ldb = localStorage;
var socket = io();
var logined = ldb.getItem('login') != null;
var roomname = location.pathname.replaceAll('/rooms/', '');

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

function initialize() {
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
	});
}

socket.on('tablechange', (number, type, value) => {
	number = parseInt(number);

	if (type == 'delete') {
		for (i = $('#table tr').length - 1; i > number; i--) {
			$('#table tr').eq(i).remove();
		}
		$('#number').val($('#table tr').length - 1);
	} else if (type == 'create') {
		console.log(number + 1);
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
			$('#table tr').eq(number).children().eq(1).html(value);
	}
});

$('#number').on('change', () => {
	if ($('#number').val() < 1) {
		$('#number').val(1);
	}
	socket.emit('numberchange', roomname, $('#number').val());
});

$('#side-settings span').eq(0).click(() => $('#file').click());

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

initialize();
