//引入文件读写
var util = require('../lib/util');
//微信配置，请替换成自己的
var path = require('path');
//定义存放凭住的文件
console.log('成功读取配置项目');
var wechat_file = path.join(__dirname,'./wechat.txt');
console.log(wechat_file);
module.exports = {
	wechat : {
		//默认配置
		appID: 'wx1429939806f6202d',
		appSecret : '82e635147bf1759546de9367d0fdefc0',
		token : 'he50501989',
		prefix : 'https://api.weixin.qq.com/cgi-bin/',
		urlAccessToken : 'token?grant_type=client_credential',
		
		//方法
		getAccessToken : function(){
			return util.readFileAsync(wechat_file);
		},
		saveAccessToken : function(data){
			//转成字符串
			data = JSON.stringify(data);
			return util.writeFileAsync(wechat_file,data);
		}
	}
}
