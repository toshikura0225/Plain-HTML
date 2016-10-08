const Http = require('http');
const Fs = require('fs');
const Url = require('url');
const OriProtocol = require('./OriProtocol.js');


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

nspSerialSocket.on('connection', function(socket){
		
	console.log("socket.io-client（シリアル通信スレーブ）が接続されました");
	
	// 定期的なポーリングを開始する
	pollingIntervalID = setInterval(pollingZW, 2000);
	
	// シリアル通信デバイスからデータによる受信イベントハンドラ
	socket.on('serial-data', function(data) {
		orionProtocol.addRecvArray(data);
	});
	
});
			
// 接続終了組み込みイベント(接続元ユーザを削除し、他ユーザへ通知)
nspSerialSocket.on("disconnect", function () {
	console.log("socket.io-client（シリアル通信スレーブ）が切断されました");
	
	// 定期的なポーリングを停止する
	clearInterval(pollingIntervalID);
});


// --------------------　シリアル通信のホスト機能　--------------------
var nspSerialSocket;	// シリアル通信デバイスとの接続のためのNamespace
var pollingIntervalID;	// 定期的にポーリングするためのsetInterval関数のID

// オリオンプロトコルのインスタンスを作成（引数はポーリング応答データ受信完了時のイベントハンドラ）
var orionProtocol = new OriProtocol(function(arrRecevData) {
	
	console.log(`ポーリング応答のデータをすべて受信完了。データ数：${arrRecevData.length}`);
	
	// socket.io-clientに受信データを転送
	//sock.write(dataArray.join(''));
	
});

// シリアル通信デバイスにポーリングを送信する
function pollingZW() {
	var pollingData = orionProtocol.getPollingBytes(0, "ZW");
	console.log(`ポーリング送信:${pollingData}`);
	nspSerialSocket.emit('serial-host-request', pollingData);
	//socket.broadcast.emit('path-through', data);	// 送信元以外に応答
	//socket.emit('path-through', data);	// 送信者を含む全員に送信
}




// ■■■■■■■■　定期的にポーリングする処理　■■■■■■■■■


/*
const Serialport = require('serialport');				// シリアル通信
const Oriprotocol = require('./OriProtocol.js');		// オリオンプロトコル
const Socket_io_client = require('socket.io-client');	// socket.ioのクライアント

// シリアルポートのインスタンス
var orionSerialPort;

// オリオンプロトコルのインスタンス
var orionProtocol;

// 使用可能なCOMポートを取得
console.log("使用可能なCOMポートを取得中...");
serialport.list(function (err, ports) {
	
	// すべての使用可能なCOMポートを列挙
	console.log("使用可能なCOM数：${ports.length}");
	ports.forEach(function (port) {
		console.log(port.comName);
	});
	
	// 使用可能なCOMポートがある場合
	if(ports.length > 0) {
		
		// 製品と通信するシリアルポートのインスタンスを作成する
		// （使用可能なCOMポートが複数存在した場合、先頭(=[0])のCOMポートを使用する）
		orionSerialPort = new serialport(ports[0], {
			baudRate: 9600,
			dataBits: 8,
			parity: 'none',
			stopBits: 1,
			flowControl: true,
		});
		
		// 受信時のイベントハンドラを定義
		orionSerialPort.on('data', function(arrRecevData) {
			// オリオンプロトコルのインスタンスにデータを受け渡す　→ポーリング応答のデータをすべて受信完了ならイベント発生
			orionProtocol.addRecvArray(recv);
		});
	}
	
	// 使用可能なCOMポートがない場合
	else {
		console.log("使用可能なCOMポートなし");
	}
});

// オリオンプロトコルのインスタンスを作成（引数はポーリング応答データ受信完了時のイベントハンドラ）
var orionProtocol = new ori_protocol(function(arrRecevData) {
	
	console.log("ポーリング応答のデータをすべて受信完了。データ数：${arrRecevData.length}");
	
	// socket.io-clientに受信データを転送
	sock.write(dataArray.join(''));
	

	
});

// socket.io-clientのインスタンスを作成
var socketioClient = socket_io_client.connect('http://localhost:3000');

// 接続完了イベントハンドラを定義
socketioClient.on('connect', function (socket) {
	
	console.log("socket.ioサーバーへの接続完了");
	
	// socket.ioサーバーからデータを受信した時のイベントハンドラを定義
	socketioClient.on('msg', function (arrRecvData) {
		
		// 受信データをシリアルポートへ転送
		if (!orionSerialPort) {
			
			// 送信
			socketioClient.write(data, function (err, results) {
				
				// 送信エラーなし
				if (!err) {
					console.log("シリアルポート送信：${results} bytes");
				}
				
				// 送信エラー
				else {
					console.log("シリアルポート送信エラー"");
					console.log(err);
					console.log(results);
					console.log();
				}
			});
		}		
	});
});
*/
console.log('Node.js running!');