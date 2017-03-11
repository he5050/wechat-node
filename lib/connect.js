'use strict'

var sha1 = require('sha1');

module.exports = function(opts){
	return function *(next){
		console.log(this.query);
		//获取token
		var token = opts.token;
		//获取微信服务端,带来的相关验证参娄
		var signature = this.query.signature;//微信服务器进行验证带过来的秘钥
		var nonce = this.query.nonce;//随机数
		var timestamp = this.query.timestamp;//时间戳
		var echostr = this.query.echostr;//随机字符串
		
		//排序过后,组成字符串,在用sha加密
		var str = [token,timestamp,nonce].sort().join('');
		var sha = sha1(str);
		
		//开发者获得加密后的字符串可与signature对比，标识该请求来源于微信
		console.log(sha);
		if(sha === signature){
			this.body = echostr+ '';
			console.log('验证成功!');
		}else{
			this.body = 'error';
			console.log('验证失败!');
		}
	}
}
