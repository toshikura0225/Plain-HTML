const Http = require('http');
const Fs = require('fs');
const Url = require('url');
const OriProtocol = require('./OriProtocol.js');
const spawn = require('child_process').spawn;

// ■■■■■■■■　HTML関連　■■■■■■■■■
var http_src = Fs.readFileSync('./index.html');		// HTMLファイルのソースを同期処理で読み出す
var js_src = Fs.readFileSync('./script.js');
var css_src = Fs.readFileSync('./style.css');

// HTTPサーバーを作成＆接続待ち
var httpServer = Http.createServer(function (req, res) {
	
	// リクエストされたURLを取得
	var url_parts = Url.parse(req.url);
	console.log(url_parts.pathname);
	
	// ルートまたはindex.htmlの場合
	if (url_parts.pathname == '/' || url_parts.pathname == '/index.html') {
		res.writeHead(200, { 'Content-Type': 'text/html' });
		res.write(http_src);
		res.end();
	}

	else if (url_parts.pathname == '/script.js') {
		res.writeHead(200, { 'Content-Type': 'text/javascript' });
		res.write(js_src);
		res.end();
	}
	
	else if (url_parts.pathname == '/style.css') {
		res.writeHead(200, { 'Content-Type': 'text/css' });
		res.write(css_src);
		res.end();
	}
	
	// その他のファイルは404コードを返答する
	else {
		res.writeHead(404);
		res.write(url_parts.pathname + "not found.");	// 脆弱性
		res.end();
	}

}).listen(process.env.PORT || 3000);	// サーバー内環境（Herokuの場合に使用）のポートまたは3000番で待受


// ■■■■■■■■　socket.ioサーバー関連　■■■■■■■■■

// socket.ioサーバーとして接続待ち
var socket_io = require('socket.io').listen(httpServer);
var nspSerialSocket = socket_io.of('/nsp_serial');	// シリアル通信デバイスとの接続のためのNamespace

// socket.ioに接続された時のイベントハンドラ
socket_io.sockets.on('connection', function(socket) {
	
	console.log("socket.io connected.");
	
	// socket.io-clientの同士を接続のためのデータ転送機能
	socket.on('path-through', function(data) {
		console.log();
		console.log("socket.io received 'path-through' event with '" + data + "' message from socket.io-client");

		// 受信データをclientへ送信
		socket.broadcast.emit('path-through', data);	// 送信元以外に応答
		//socket.emit('path-through', data);	// 送信者を含む全員に送信
	});
});


// --------------------　シリアル通信のホスト機能　--------------------
var pollingIntervalID;	// 定期的にポーリングするためのsetInterval関数のID

nspSerialSocket.on('connection', function(socket){
		
	console.log("socket.io-client（シリアル通信スレーブ）が接続されました");
	
	// 定期的なポーリングを開始する
	pollingIntervalID = setInterval(pollingZW, 2000);
	
	// シリアル通信デバイスからデータによる受信イベントハンドラ
	socket.on('serial-data', function(data) {
		orionProtocol.addRecvArray(data);
	});
});

nspSerialSocket.on("disconnect", function () {
	console.log("socket.io-client（シリアル通信スレーブ）が切断されました");
	
	// 定期的なポーリングを停止する
	clearInterval(pollingIntervalID);
});

// オリオンプロトコルのインスタンスを作成（引数はポーリング応答データ受信完了時のイベントハンドラ）
var orionProtocol = new OriProtocol(function(arrRecevData) {
	
	console.log(`ポーリング応答データを受信完了。データ長：${arrRecevData.length}`);
	
	// 受信データから値の配列を取得
	var numberArray = orionProtocol.getPollingDataArray(arrRecevData);
	console.log(numberArray.join(','));
	
	/*
	const ls = spawn('./a.out', [444]);
	
	ls.stdout.on('data', (data) => {
	  console.log(`stdout: ${data}`);
	});

	ls.stderr.on('data', (data) => {
	  console.log(`stderr: ${data}`);
	});

	ls.on('close', (code) => {
	  console.log(`child process exited with code ${code}`);
	});
	*/
	
});

// シリアル通信デバイスにポーリングを送信する
function pollingZW() {
	var pollingData = orionProtocol.getPollingBytes(0, "ZW");
	console.log(`シリアル通信デバイスへポーリングデータを送信:${pollingData}`);
	nspSerialSocket.emit('serial-host-request', pollingData);
}

console.log('server.js running!');
