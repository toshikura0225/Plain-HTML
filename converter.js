const Serialport = require('serialport');				// シリアル通信
const Socket_io_client = require('socket.io-client');	// socket.ioのクライアント

const SOCKET_IO_SERVER_HOST = "localhost";	// ホスト名
const SOCKET_IO_SERVER_PORT = 3000;			// ポート番号
const SOCKET_IO_SERVER_NSP = "nsp_serial";	// Namespace名

// シリアルポート設定
var serialport_propery = {
	baudRate: 9600,
	dataBits: 8,
	parity: 'none',
	stopBits: 1,
	flowControl: true,
};


// ■■■■■■■■■■■　シリアルポート関連　■■■■■■■■■■■■
// シリアルポートのインスタンス
var serial;

// 使用可能なCOMポートを取得
console.log("使用可能なCOMポートを取得中...");
Serialport.list(function (err, ports) {
	
	// すべての使用可能なCOMポートを列挙
	console.log(`使用可能なCOMポート数：${ports.length}`);
	ports.forEach(function (port) {
		console.log(port.comName);
	});
	
	// 使用可能なCOMポートがある場合
	if(ports.length > 0) {
		
		// 製品と通信するシリアルポートのインスタンスを作成する
		// （使用可能なCOMポートが複数存在した場合、先頭(=[0])のCOMポートを使用する）
		//serial = new Serialport(ports[1].comName, serialport_propery);
		serial = new Serialport("COM64", serialport_propery);
		
		// 受信時のイベントハンドラを定義
		serial.on('data', function(arrRecvData) {
			
			//console.log(`シリアル通信受信：${arrRecvData.length} bytes`);
			
			// シリアル通信からの受信データをsocket.ioサーバーへ転送
			if( socketioClient ) {
				//socketioClient.send(arrRecvData
				socketioClient.emit("serial-data", arrRecvData);
			}
		});
	}
	
	// 使用可能なCOMポートがない場合
	else {
		console.log("Error：使用可能なCOMポートなし");
	}
});



// ■■■■■■■■■■■　socket.io（クライアント）関連　■■■■■■■■■■■■

// socket.io-clientのインスタンスを作成
var socketio_server = "http://" + SOCKET_IO_SERVER_HOST + ":" + SOCKET_IO_SERVER_PORT + "/" + SOCKET_IO_SERVER_NSP;
var socketioClient = Socket_io_client.connect(socketio_server);

console.log(`connecting to ${socketio_server}`);

// 接続完了イベントハンドラを定義
socketioClient.on('connect', function (socket) {
	
	console.log(`${socketio_server}への接続完了`);
	
	// socket.ioサーバーからデータを受信した時のイベントハンドラを定義
	socketioClient.on('serial-host-request', function (arrRecvData) {
		
		// socket.ioサーバーからの受信データをシリアルポートへ転送
		if (serial) {
			
			// シリアルポートへ送信
			serial.write(arrRecvData, function (err, results) {
				
				// 送信エラーなし
				if (!err) {
					console.log(`シリアルポート送信：${arrRecvData} bytes ${new Date()}`);
				}
				
				// 送信エラー
				else {
					console.log("Error:シリアルポート送信エラー");
					console.log(err);
					console.log(results);
					console.log();
				}
			});
		}		
	});
});
