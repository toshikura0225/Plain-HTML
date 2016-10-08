// OriProtocolクラス
OriProtocol = function(argCallback) {
	
	this.recvData = [];
	this.dataReceivedEventHandler = argCallback;
	
	
	this.recvState = recvStateType.watingSTX;
}

module.exports = OriProtocol;

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
OriProtocol.prototype.getBCC = function(dataArray) {
	
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
OriProtocol.prototype.getPollingBytes = function(address, command) {

	return [ASCIIChar.EOT,
			address / 10 + 0x30,
			address % 10 + 0x30,
			command.charCodeAt(0),
			command.charCodeAt(1),
			ASCIIChar.ENQ];
}

// 受信データ配列に引数のデータ配列を追加する
OriProtocol.prototype.addRecvArray = function(argArray) {
	
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
				
				this.recvData.push(argArray[i]);
				this.recvState = recvStateType.watingETX;
			}
		}
	}
}