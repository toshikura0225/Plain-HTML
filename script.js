var socket;

$(function () {
	
	// サーバーに接続
	socket = io.connect();
	
	// メッセージ受信イベント（PVを受信）
	socket.on('path-through', function (data) {
		
		$('#idReceived').prepend(data + '<br/>');		// デバッグ用に書き出し
		
	});	
	
});

function debug1() {
	socket.emit('path-through', 'test message');
}