var serialport = require('serialport');
var OriProtocol = require('./OriProtocol.js');

var net = require('net');
var HOST = '127.0.0.1';
var PORT = 3000;

// シリアルポートのインスタンス
var sp;

	
// 使用可能なCOMポートを書き出す
serialport.list(function (err, ports) {
	console.log("Available ports are ...");
	ports.forEach(function (port) {
		console.log(port.comName);
	});	
	
	// シリアルポートのインスタンスを作成する
	sp = new serialport(ports[0].comName, {
		baudRate: 9600,
		dataBits: 8,
		parity: 'none',
		stopBits: 1,
		flowControl: true,
	});
	
	// サーバーインスタンスを生成し、リッスンします
	// net.createServer()に渡す関数は、'connection'イベントハンドラーになります。
	// コールバック関数が受け取るsockeオブジェクトは各接続ごとにユニークなものとなります。
	net.createServer(function(sock) {
		// TCPサーバーが接続しました。socketオブジェクトが自動的に割り当てられます。
		console.log('CONNECTED: ' + sock.remoteAddress +':'+ sock.remotePort);
	
		// 'data' イベントハンドラー
		sock.on('data', function(data) {
			console.log('tcp to serial: ' + data );
			// tcp→serial
			sp.write(data, function (err, results) {
				if (!err) {	// エラーなし
					console.log(results + ' bytes written');
				} else {		// エラーあり
					console.log("error : " + err + "  " + results);
				}
			});
		});
		
		// 'close'イベントハンドラー
		sock.on('close', function(had_error) {
			console.log('CLOSED. Had Error: ' + had_error);
		});
		
		// 'errer'イベントハンドラー
		sock.on('error', function(err) {
			console.log('ERROR: ' + err.stack);
		});
		
		
		// 受信イベントハンドラを定義
		sp.on('data', function (recv) {
			
			console.log('serial to tcp:' + recv);
			//console.log('serial to tcp');
			
			/*
			// 受信データをファイルに書き出し
			fs.appendFile('zw.csv', recv, 'utf8', function (err) {
				if (!err) {
					fs.appendFileSync('zw.csv', '\n', 'utf8');
				} else {
					console.log('recv_err:' + err);
				}
			});
			*/
			
			
			
			oriPro.addRecvArray(recv);
		});
		
		var oriPro = new OriProtocol(function(dataArray) {
			console.log("data received");
			//console.log(dataArray);
			//console.log(dataArray);

			// serial→tcp
			//dataArray = [1,2,3];
			sock.write(dataArray.join(''));		
		});
		
	}).listen(PORT, HOST);

});

console.log('Server listening on ' + HOST +':'+ PORT);
