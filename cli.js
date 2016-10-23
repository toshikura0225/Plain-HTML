var client_ftp = require('ftp');
// ■■■■■■■■　socket.io-client（クライアント側）　■■■■■■■■■
const exec = require('child_process').exec;



function StartTimeout(interval)
{
	console.log("taking picture...");
	
	setTimeout(() => {

		TakePicture();
	
	}, interval);
}

function TakePicture()
{
//	exec("raspistill -o cam1.jpg",
	exec("ipconfig",
	//{cwd: 'C:\\Users\\Toshihiro\\Desktop\\PersonalDevice\\PersonalDeviceApp'},
	(error, stdout, stderr) => {
		if (error) {
			console.error('exec error:' + error);
			return;
		}
		else
		{
			cli_ftp.put('abc.txt', 'r_abc.txt', function(err) {
				if (err) 
				{
				  console.log(`ftp erro : {$err}`);
				}
				else
				{
					console.log(`upload completed:{$err}`);
					
					StartTimeout(2000);
				}
			});
		}
		console.log('stdout: ' + stdout);
		console.log('stderr: ' + stderr);
	});
}

var cli_ftp = new client_ftp();


cli_ftp.on('ready',function(){
	console.log("ftp client connected.");
	StartTimeout(1000);
});

cli_ftp.on('error',function(err){
	console.log(err);
	cli_ftp.end();
});

cli_ftp.on('greeting',function(message){
	console.log(message);
});

cli_ftp.connect({
	host:"ftp.geocities.jp",
	//port:21,//portが21の場合は省略可能
	user:"roseandryou",
	password:"midorikuribo"
});


console.log('Camera Running!');
