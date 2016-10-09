// OriMasterProtocolクラス
OriMasterProtocol = function(argCallback) {
	
	this.recvData = [];
	this.dataReceivedEventHandler = argCallback;
	
	
	this.recvState = recvStateType.watingSTX;
}

module.exports = OriMasterProtocol;

// 受信状態
var recvStateType = {
	watingSTX : 0,
	watingETX : 1,
	watingBCC : 2,
};

// ASCIIコード
var ASCIIChar = {
	STX : 2,
	ETX : 3,
	EOT : 4,
	ENQ : 5,
};

// BCCを取得する（STXの次からETXまでのBCC）
OriMasterProtocol.prototype.getBCC = function(dataArray) {
	
	var afterSTX = false;
	var bcc = 0;

	for(i=0; i<dataArray.length; i++) {
		
		if(dataArray[i] == ASCIIChar.STX) {
			afterSTX = true;
		}
		
		if(afterSTX) {
			bcc ^= dataArray[i];
			if(dataArray[i] == ASCIIChar.ETX)
			{
				break;
			}
		}
	}
	
	return bcc;
}

// ポーリング要求のデータ配列を取得する
OriMasterProtocol.prototype.getPollingBytes = function(address, command) {

	return [ASCIIChar.EOT,
			address / 10 + 0x30,
			address % 10 + 0x30,
			command.charCodeAt(0),
			command.charCodeAt(1),
			ASCIIChar.ENQ];
}

// 受信データ配列に引数のデータ配列を追加する
OriMasterProtocol.prototype.addRecvArray = function(argArray) {
	
	for(var i=0; i<argArray.length; i++) {
		
		if(this.recvState == recvStateType.watingBCC) {
			
			this.recvData.push(argArray[i]);
			
			// BCCチェック
			//if(this.getBCC(this.recvData) == argArray[i]) {
				this.dataReceivedEventHandler(this.recvData);
			//}			
			
			// 初期化
			this.recvData = [];
			this.recvState = recvStateType.watingSTX
			
			break;
		}
		
		else if(this.recvState == recvStateType.watingETX) {
			
			if(argArray[i] == ASCIIChar.ETX) {
				
				this.recvState = recvStateType.watingBCC;
			}
			
			this.recvData.push(argArray[i]);
		}
		
		else if(this.recvState == recvStateType.watingSTX) {
			
			if(argArray[i] == ASCIIChar.STX) {
				this.recvData = [];
				this.recvData.push(argArray[i]);
				this.recvState = recvStateType.watingETX;
			}
		}
	}
}

// ポーリング応答データからデータ配列を取得
OriMasterProtocol.prototype.getPollingDataArray = function(argArray) {

	var retDataArray = [];	// 戻り値として返す配列
	var afterSTX = false;	// STXより後のデータか
	var num = 0.0, decimalPlace = 0, afterPoint = false;	// 値
	var init = function() {num = 0.0; decimalPlace = 0; afterPoint = false};	// 値を初期化
	var toNum = function(ascii_code) {return (ascii_code - 48);};	// ASCIIコードから数値へ
	
	for(i=0; i<argArray.length; i++)
	{
		if(afterSTX) {
			if(argArray[i] == ASCIIChar.ETX) {	// ETX
				break;
			}
			else if(String.fromCharCode(argArray[i]) >= '0' && String.fromCharCode(argArray[i]) <= '9') {	// 数値
				num = num * 10 + toNum(argArray[i]);
				decimalPlace = (afterPoint) ? (decimalPlace+1) : 0;
			}
			else if(String.fromCharCode(argArray[i]) == ' ') {	// スペース
				continue;
			}
			else if(String.fromCharCode(argArray[i]) == ',') {	// カンマ
				num /= Math.pow(10, decimalPlace);
				retDataArray.push(num);
				init();
			}
			else if(String.fromCharCode(argArray[i]) == '.') {	// ピリオド
				afterPoint = true;
			}
		}
		else {
			if(argArray[i] == ASCIIChar.STX) {	// STX
				afterSTX = true;
			}
		}
	}

	return retDataArray;
}
