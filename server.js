var serialport = require('serialport');
var OriProtocol = require('./OriProtocol.js');

var net = require('net');
var HOST = '172.16.2.233';
var PORT = 3000;

// シリアルポートのインスタンス
var sp;
const spawn = require('child_process').spawn;
	
// 使用可能なCOMポートを書き出す
serialport.list(function (err, ports) {
	console.log("Available ports are ...");
	ports.forEach(function (port) {
		console.log(port.comName);
	});	
	
	// シリアルポートのインスタンスを作成する
	sp = new serialport("/dev/ttyACM0", {
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
	
	const ls = spawn('./a.out', [1]);
	
	ls.stdout.on('data', (data) => {
	  console.log(`stdout: ${data}`);
	});

	ls.stderr.on('data', (data) => {
	  console.log(`stderr: ${data}`);
	});

	ls.on('close', (code) => {
	  console.log(`child process exited with code ${code}`);
	});
	
	
	/*
			exec("/home/pi/sharedRP/Plain-HTML/a.out",
				//{cwd: '/home/pi/sharedRP/Plain-HTML'},
				function(error, stdout, stderr) {
					if (error) {
						console.error('exec error:' + error);
						return;
					}
					console.log('stdout: ' + stdout);
					console.log('stderr: ' + stderr);
				}
			);
	*/
});

console.log('Server listening on ' + HOST +':'+ PORT);
