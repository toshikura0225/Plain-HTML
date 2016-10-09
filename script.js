
$(function () {
	

	
});

var socket;
function debug1() {
	// サーバーに接続
	socket = io.connect("/nsp_monitor");
	
	// メッセージ受信イベント（PVを受信）
	socket.on('monitor-data', function (data) {
		
		console.log("data = " + data[0]);
		$('#idReceived').prepend(data + '<br/>');		// デバッグ用に書き出し
		
	});
}
function debug2() {
	socket.emit('path-through', 'test message');
}
function debug3() {

}
function debug4() {

}
function debug5() {

}