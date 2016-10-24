var myExtension = require('./build/Release/my_extension');

var dt = new Date();
console.log(`start : ${dt.getMinutes()}.${dt.getMilliseconds()}`);

//console.log(myExtension.hello()); // hello, world が出力される
//myExtension.hello([35.01,33,54,101,35.74,42.52,42.09,1.006,0.465,2.428,1104,6.4,9.2]);
console.log(myExtension.hello(35.01,33,54,101,35.74,42.52,42.09,1.006,0.465,2.428,1104,6.4,9.2));

dt = new Date();
console.log(`end : ${dt.getMinutes()}.${dt.getMilliseconds()}`);