const Http = require('http');
const Fs = require('fs');
const Url = require('url');
const OriMasterProtocol = require('./OriMasterProtocol.js');
const OriReplicaProtocol = require('./OriReplicaProtocol.js');
const spawn = require('child_process').spawn;
const mongoose = require('mongoose');
const net = require('net');

var TCPIP_SERVER_HOST = '172.16.2.85';	// Denshi46
//const TCPIP_SERVER_HOST = '172.16.2.206';	// Raspi02
const TCPIP_SERVER_PORT = 3001;

var latestDocument;

// ■■■■■■■■　HTML関連　■■■■■■■■■
var http_src = Fs.readFileSync('./index.html');		// HTMLファイルのソースを同期処理で読み出す
var js_src = Fs.readFileSync('./script.js');
var css_src = Fs.readFileSync('./style.css');
var flot_src = Fs.readFileSync('./jquery.flot.js');

//var Iconv = require('iconv').Iconv;
var csvParse = require('csv-parse');
//var iconv = new Iconv('SHIFT_JIS', 'UTF-8//TRANSLIT//IGNORE');

// MD値の計算要素を取得
var data_config = Fs.readFileSync('./data_config.csv');
var MDCalcSrcList = [];	// MD値計算の要素
var AveSrcList = [];	// MD値計算の要素の平均値
var SdSrcList = [];		// MD値計算の要素の標準偏差
// CSVファイルを読込み
//csvParse(sjis.convert(csv_data).toString(), function(err, csvOutput) {
csvParse(data_config, { comment: '#' }, function(err, csvOutput) {
	//console.log(csvOutput);
	
	//console.log(csvOutput[0]);
	//console.log(csvOutput[0][4]);

	for (var i = 0; i < csvOutput.length; i++) {

		if (csvOutput[i][1] == "1") {
			MDCalcSrcList.push(Number(csvOutput[i][0]));
			AveSrcList.push(Number(csvOutput[i][2]));
			SdSrcList.push(Number(csvOutput[i][3]));
		}
	}

});


// MD値の逆行列を取得
var md_config = Fs.readFileSync('./md_config.csv');
var INV_MATRIX = [];
csvParse(md_config, { comment: '#' }, function (err, csvOutput) {

	for (var i = 0; i < csvOutput.length; i++) {

		INV_MATRIX[i] = [];

		for (var j = 0; j < csvOutput[i].length; j++) {

			INV_MATRIX[i].push(Number(csvOutput[i][j]));
		}
	}
	
});


// IPアドレス設定を取得
var com_config = Fs.readFileSync('./com_config.csv');
csvParse(com_config, { comment: '#' }, function (err, csvOutput) {
	
	TCPIP_SERVER_HOST = csvOutput[0][1];





	// ■■■■■■■■　MongoDB関連　■■■■■■■■■
	//mongoose.connect(`mongodb://${TCPIP_SERVER_HOST}:27017/rks`, function (err) {
	mongoose.connect(`mongodb://localhost:27017/rks`, function (err) {
		if (err) {
			console.log(`connect error ${err}`);
		} else {
			console.log('connection success!');

			setInterval(function () {
				//			Rks.find({}, {}, {sort:{created: -1}, limit:1}, function(err, docs) {
				Rks.findOne({}, {}, { sort: { date: -1 }, limit: 1 }, function (err, doc) {
					if (!err) {
						//console.log("num of ite => " + docs.length);
						//for(var i=0; i<docs.length; i++) {
						//	console.log(docs[i]);
						//}
						//mongoose.disconnect();
						//process.exit();
						//console.log(docs[0].seq);
						//if(docs.length > 0) {
						latestDocument = doc;
						//console.log(docs[0].date);
						//}
					} else {
						console.log("find error");
					}
				});
			}, 1000);
		}
	});


	net.createServer(function (sock) {

		var oriReplicaProtocol = new OriReplicaProtocol(function (polling) {


			if (polling.command == "ZW") {
				console.log("ZW data received");
				//console.log(latestData.bufferArray[0]);
				//tcpSocket.write(latestDocument.buf[0]);

				// MD値を付加して送信
				temporaryResponse(sock);

			}
		});

		// TCPサーバーが接続しました。socketオブジェクトが自動的に割り当てられます。
		console.log('CONNECTED: ' + sock.remoteAddress + ':' + sock.remotePort);

		// 'data' イベントハンドラー
		sock.on('data', function (data) {

			//console.log('received on tcp: ' + data );
			oriReplicaProtocol.addRecvArray(data);
		});

		// 'close'イベントハンドラー
		sock.on('close', function (had_error) {
			console.log('CLOSED. Had Error: ' + had_error);
		});

		// 'errer'イベントハンドラー
		sock.on('error', function (err) {
			console.log('ERROR: ' + err.stack);
		});

		tcpSocket = sock;

	}).listen(TCPIP_SERVER_PORT, TCPIP_SERVER_HOST);


});





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
	
	else if (url_parts.pathname == '/jquery.flot.js') {
		res.writeHead(200, { 'Content-Type': 'text/javascript' });
		res.write(flot_src);
		res.end();
	}
	
	// その他のファイルは404コードを返答する
	else {
		res.writeHead(404);
		res.write(url_parts.pathname + "not found.");	// 脆弱性
		res.end();
	}

//}).listen(process.env.PORT || 3000);	// サーバー内環境（Herokuの場合に使用）のポートまたは3000番で待受
}).listen(3000);	// サーバー内環境（Herokuの場合に使用）のポートまたは3000番で待受


// ■■■■■■■■　socket.ioサーバー関連■■■■■■■■■

// socket.ioサーバーとして接続待ち
var socket_io = require('socket.io').listen(httpServer);

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

// --------------------　WEBブラウザへのデータ応答機能　--------------------
var nspMonitorSocket = socket_io.of('/nsp_monitor');
nspMonitorSocket.on('connection', function(socket){
		
	console.log("socket.io-client（モニター側）が接続されました");
	
});

setInterval(function () {
	if (latestDocument !== undefined && latestDocument != null) {
		nspMonitorSocket.emit("monitor-data", { time_stamp: latestDocument.date, monitor_data: latestDocument.val });
	}
}, 2000);


// --------------------　シリアル通信のホスト機能　--------------------
var nspSerialSocket = socket_io.of('/nsp_serial');	// シリアル通信デバイスとの接続のためのNamespace
var pollingIntervalID;	// 定期的にポーリングするためのsetInterval関数のID

nspSerialSocket.on('connection', function(socket){
		
	console.log("socket.io-client（シリアル通信スレーブ）が接続されました");
	
	// 定期的なポーリングを開始する
	pollingIntervalID = setInterval(pollingZW, 2000);
	
	// シリアル通信デバイスからデータによる受信イベントハンドラ
	socket.on('serial-data', function(data) {
		orionMasterProtocol.addRecvArray(data);
	});
});

nspSerialSocket.on("disconnect", function () {
	console.log("socket.io-client（シリアル通信スレーブ）が切断されました");
	
	// 定期的なポーリングを停止する
	clearInterval(pollingIntervalID);
});

// オリオンプロトコルのインスタンスを作成（引数はポーリング応答データ受信完了時のイベントハンドラ）
var orionMasterProtocol = new OriMasterProtocol(function(arrRecevData) {
	
	console.log(`ポーリング応答データを受信完了。データ長：${arrRecevData.length}`);

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
	
	// ポーリング応答データをデータベースに保存する
	saveZW(arrRecevData);
});

// シリアル通信デバイスにポーリングを送信する
function pollingZW() {
	var pollingData = orionMasterProtocol.getPollingBytes(0, "ZW");
	console.log();
	console.log(new Date());
	console.log(`シリアル通信デバイスへポーリングデータを送信:${pollingData}}`);
	nspSerialSocket.emit('serial-host-request', pollingData);
}

	
var rksSchema = new mongoose.Schema({
	sv: Number,
	pv: Number,
	md: Number,
	buf: [Buffer],
	val: Array,
	date: Date,
});

var Rks = mongoose.model('rks', rksSchema);

// MD値計算
var mdCalculator = require('./build/Release/my_extension');

// ポーリング応答データをデータベースに保存する
function saveZW(arrRecevData) {
	
	// 受信データから値の配列を取得
	var numberArray = orionMasterProtocol.getPollingDataArray(arrRecevData);
	//console.log(numberArray.join(','));

	// MD値を計算
	var MD_Value = mdCalculator.GetMD(
		numberArray[MDCalcSrcList[0]], 
		numberArray[MDCalcSrcList[1]], 
		numberArray[MDCalcSrcList[2]], 
		numberArray[MDCalcSrcList[3]], 
		numberArray[MDCalcSrcList[4]], 
		numberArray[MDCalcSrcList[5]], 
		numberArray[MDCalcSrcList[6]], 
		numberArray[MDCalcSrcList[7]], 
		numberArray[MDCalcSrcList[8]], 
		numberArray[MDCalcSrcList[9]], 
		numberArray[MDCalcSrcList[10]],
		numberArray[MDCalcSrcList[11]],
		numberArray[MDCalcSrcList[12]],
		AveSrcList[0],
		AveSrcList[1],
		AveSrcList[2],
		AveSrcList[3],
		AveSrcList[4],
		AveSrcList[5],
		AveSrcList[6],
		AveSrcList[7],
		AveSrcList[8],
		AveSrcList[9],
		AveSrcList[10],
		AveSrcList[11],
		AveSrcList[12],
		SdSrcList[0],
		SdSrcList[1],
		SdSrcList[2],
		SdSrcList[3],
		SdSrcList[4],
		SdSrcList[5],
		SdSrcList[6],
		SdSrcList[7],
		SdSrcList[8],
		SdSrcList[9],
		SdSrcList[10],
		SdSrcList[11],
		SdSrcList[12]
	)[0];
	//var MD_Value = 12.3456;

	console.log(`MDonSERVER=${MD_Value}`);

	// データベースに保存するデータにMD値を追加
	//numberArray.push(MD_Value);

	// データベースに保存
	var rks = new Rks({ sv: numberArray[0], pv: numberArray[1], md: MD_Value, buf: new Buffer(arrRecevData), val : numberArray, date: new Date()});
	rks.save(function(err, doc, affected) {
		if (err) {
			console.log(`save error:${err}`);
		} else {
			//console.log(doc);
		}
	});
}


// ■■■■■■■■　TCP/IPサーバー関連関連　■■■■■■■■■
var tcpSocket;

	
function temporaryResponse(sock) {
	
	var md = latestDocument.md;
	
	
	var before = latestDocument.buf[0].slice(0, latestDocument.buf[0].length - 2);
		
	var strMD = latestDocument.md.toFixed(2);
	
	arr = [44];
	
	// MD値
	for(var i=0; i<strMD.length; i++)
	{
		arr.push(strMD.charCodeAt(i));
	}
	
	// ETX
	arr.push(3);
	
	// 
	var indexOfSTX = arr.indexOf(2);
	var bcc = 0;
	for(var i=indexOfSTX+1; i<arr.length; i++) {
		
		bcc ^= arr[i];
	}

	// BCC
	arr.push(bcc);
	
	// 送信
	sock.write(before);
	
	// 送信
	sock.write(new Buffer(arr));
	
}

console.log('server.js running!');

