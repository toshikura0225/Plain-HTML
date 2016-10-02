var http = require('http');
var fs = require('fs');
var url = require('url');
var serialport = require('serialport');



// ■■■■■■■■　Node.js　■■■■■■■■■
var http_src = fs.readFileSync('./index.html');		// HTMLファイルのソースを同期処理で読み出す
var js_src = fs.readFileSync('./script.js');
var css_src = fs.readFileSync('./style.css');

// HTTPサーバーを作成
var app = http.createServer(function (req, res) {
	
	// リクエストされたURLを取得
	var url_parts = url.parse(req.url);
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

}).listen(process.env.PORT || 3000);	// サーバー内環境のポートまたは3000番で待受

console.log('Server running!');