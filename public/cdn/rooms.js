let socket = io();
let ldb = localStorage;
let logined = ldb.getItem('login') != null;

if (logined) {
	$('#overlay').css('display', 'none');
} else {
	location = '/login';
}

function refresh() {
	$('#content').empty();
	socket.emit('roomlist', null, list => {
		let html = '';
		list.forEach(item => {
			html += '<div class="room-container">';
				html += `<div class="room-label">${item}</div>`;
				html += `<div class="delete">delete</div>`;
			html += '</div>';
		});
		$('#content').html($('#content').html() + html);

		for (i in document.getElementsByClassName('delete')) {
				document.getElementsByClassName('delete')[i].onclick = e => {
					let target = e.toElement;

					if (confirm('Are you sure you want to delete this room?')) {
						socket.emit('deleteroom', $(target).parent().text().replace('delete', ''));
						$(target).parent().remove();
					}
				}
		}

		for (i in document.getElementsByClassName('room-label')) {
			document.getElementsByClassName('room-label')[i].onclick = e => {
				let target = e.toElement;
				location = '/rooms/' + $(target).text().replaceAll(' ', '-');
			}
		}
	});
}

$('#header span').eq(0).click(() => {
	if (confirm('Are you sure you wanna log out?')) {
		ldb.removeItem('login');
		location = '/login';
	}
});

$('#header span').eq(1).click(() => {
	if ($('.room-container').length <= 10) {
		let name = prompt('Enter the new room name:');

		if (name.trim() == '') {
			alert('Room name cannot be empty');
			$('#header span').eq(1).click();
		} else if (name != null) {
			socket.emit('createroom', name, refresh);
		}
	} else {
		alert('Rooms count has achieved is maximum amount(10)');
	}
});

refresh();
