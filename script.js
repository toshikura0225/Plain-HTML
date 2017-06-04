
$(function () {
	

	
});

var socket;
function debug1() {
	// サーバーに接続
	socket = io.connect();
	
	// メッセージ受信イベント（PVを受信）
	socket.on('path-through', function (data) {
		
		$('#idReceived').prepend(data + '<br/>');		// デバッグ用に書き出し
		
	});
	socket.on('start-camera', function (data) {
		
		$('#idReceived').prepend(data.a + ' ' + data.b + '<br/>');		// デバッグ用に書き出し
		
	});
	socket.on('reload-image', function (data) {
		
		//$('#idReceived').prepend('reload-image' + + new Date() + '<br/>');		// デバッグ用に書き出し
		document.getElementById("img1").src = "http://www.cralynet.com/r_cam1.jpg?time=" + new Date();
	});
	socket.on('stop-camera', function (data) {
		
		$('#idReceived').prepend('stop-camera<br/>');		// デバッグ用に書き出し
		
	});
}
function debug2() {
	socket.emit('path-through', 'test message');
}
function debug3() {
	socket.json.emit('start-camera', {"a" : $("#idA").val(), "b" : $("#idB").val()});
}
function debug4() {
	socket.emit('stop-camera', 'test message');
}
function debug5() {

}
