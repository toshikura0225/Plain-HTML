// OriReplicaProtocolクラス
OriReplicaProtocol = function(argCallback) {
	
	this.recvData = [];
	this.dataReceivedEventHandler = argCallback;
	
	
	//this.recvState = recvStateType.watingSTX;
}

module.exports = OriReplicaProtocol;

// 受信状態
//var recvStateType = {
//	watingEOT : 0,
//	watingENQ : 1,
//};

// ASCIIコード
var ASCIIChar = {
	STX : 2,
	ETX : 3,
	EOT : 4,
	ENQ : 5,
};


// 受信データ配列に引数のデータ配列を追加する
OriReplicaProtocol.prototype.addRecvArray = function(argArray) {
	
	for(var i=0; i<argArray.length; i++) {
		
		if (argArray[i] == ASCIIChar.EOT) {
			this.recvData = [];
			this.recvData.push(argArray[i]);
		}
		else if (argArray[i] == ASCIIChar.ENQ) {
			this.recvData.push(argArray[i]);
			
			if (this.recvData.length == 6 && this.recvData[0] == ASCIIChar.EOT && this.recvData[5] == ASCIIChar.ENQ) {
				var addr = (this.recvData[1] - 0x30) * 10 + (this.recvData[2] - 0x30);
				var comm = String.fromCharCode(this.recvData[3], this.recvData[4]);
				
				// 受信完了イベントハンドラ
				this.dataReceivedEventHandler({address : addr, command : comm});
			}	
						
			this.recvData = [];
			break;
		}
		else {
			this.recvData.push(argArray[i]);
		}
	}
}
