
var ldb = localStorage;
var socket = io();
var logined = ldb.getItem('login') != null;

if (logined) {
	location = '/rooms';
} else {
	$('#overlay').css('display', 'none');
}

$('#enter').click(async () => {
	var username = $('.text').eq(0).val();
	var password = $('.text').eq(1).val();
	
	if (username.trim() == '' || password.trim() == '') {
		alert('Username or Password field cannot be empty');
	} else {
		$('#loader-div').css('display', 'flex');
		socket.emit('login', {
			username: username,
			password: password
		}, success => {
			if (success) {
				ldb.setItem('login', username);
				location = '/rooms';
			} else {
				$('#loader-div').css('display', 'none');
				alert('Error: Username and password does not match');
			}
		});
	}
});

$(window).on("keydown", e => {
	if (e.which == 13) {
		$('#enter').click();
	}
});