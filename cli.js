var intervalConst = 2000;

var client_ftp = require('ftp');
// ■■■■■■■■　socket.io-client（クライアント側）　■■■■■■■■■
const exec = require('child_process').exec;
const client = require('socket.io-client');

var timeoutID;

var socket = client.connect('http://kaden.herokuapp.com/');
//var socket = client.connect('http://localhost:3000/');

// ○○秒後に写真を撮る
function StartTimeout(interval)
{
	console.log("wating..." + new Date());
	
	timeoutID = setTimeout(function() {

		TakePicture_Upload();
	
	}, interval);
}

// 写真を撮ってアップロードする
function TakePicture_Upload()
{
	takePicture(uploadPicture);
}

// 写真を撮る
function takePicture(takenCallback)
{
	console.log("taking picture..." + new Date());
	exec("raspistill -t 1 -w 420 -h 300 -o cam1.jpg",
//	exec("ipconfig",
	//{cwd: 'C:\\Users\\Toshihiro\\Desktop\\PersonalDevice\\PersonalDeviceApp'},
	function(error, stdout, stderr) {
		if (error) {
			console.log("taking picture error! Good Bye!");
			console.error('error:' + error);
			console.error('stdout: ' + stdout);
			console.error('stderr: ' + stderr);
			return;
		}
		else
		{
			console.log("taken:" + new Date());
			takenCallback();
		}
	});
}

// 写真をアップロードする
function uploadPicture()
{
	console.log("uploading picture..." + new Date());
	cli_ftp.put('cam1.jpg', 'r_cam1.jpg', function(err) {
		if (err) 
		{
		  console.log("upload error : " + err);
		}
		else
		{
			console.log("uploaded:" + new Date());
			socket.emit('reload-image', '');
			StartTimeout(intervalConst);
		}
	});
}




var cli_ftp = new client_ftp();

cli_ftp.on('ready',function(){
	console.log("ftp client connected. ready...");
	
	// カメラを開始
	StartTimeout(1000);
});

cli_ftp.on('error',function(err){
	console.log(err);
	cli_ftp.end();
});

cli_ftp.on('greeting',function(message){
	console.log('----- greeting-----');
	console.log(message);
	console.log('-------------------');
});

socket.on('connect', function () {
	
	console.log("socket.io-client received connect event");
	
	socket.on('path-through', function(data) {
		console.log();
		console.log("socket.io received 'path-through' event and '" + data + "' message from html");
	});
	
	socket.on('start-camera', function(data) {
		console.log('start-camera:' + data.a + "  " + data.b);
		
		cli_ftp.connect({
			host:"ftp.geocities.jp",
			//port:21,//portが21の場合は省略可能
			//user:data.a,
			//password:data.b
			user:"roseandryou",
			password:"midorikuribo"
		});

	});
	
	socket.on('stop-camera', function(data) {
		console.log();
		console.log("socket.io received 'stop-camera' event");
		clearTimeout(timeoutID);
		cli_ftp.end();
	});

});


console.log('Camera Running!');
