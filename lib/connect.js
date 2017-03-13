'use strict'

//引入加密
var sha1 = require('sha1');
//引入 bluebird也就是Promise对象
var Promise = require('bluebird');
//用于解析
var util = require('./util');
var getRawBody = require('raw-body');
//返回promise之后的request 对象
var request = Promise.promisify(require('request'));

console.log('成功通信微信');
/*
 * 用于获取access_token
 */
function Wechat(opts){
	//保存当前对象
	var _self = this;
	//获取当前的appID,appSecret,获取与保存accessToken的方法
	this.appID = opts.appID;
	this.appSecret = opts.appSecret;
	this.getAccessToken = opts.getAccessToken;
	this.saveAccessToken = opts.saveAccessToken;
	this.urlAccessToken = opts.prefix+opts.urlAccessToken;
	
	//关于这里的不是很理解的话请自行查阅promise相关文档,promise主是要为了解决回调中的问题
	this.getAccessToken()
	  .then(function(data){
	  	try{
	  		//把获取到的内容转成json对象
	  		data = JSON.parse(data);
	  	}catch(e){
	  		//如果获取异常
	  		console.log(e.message);
	  		//重新更新
	  		return _self.updateAccessToken();
	  	}
	  	//成功获取到access_token之后,我们对其进行有效验证
	  	if(_self.isValidAccessToken(data)){
	  		console.log('验证通过,把有效的data,接着传递下去!');
	  		console.log(data);
	  		console.log('成功获取到有效的凭证');
		  	//能过上面的获取与验证,我们可以获取到正确的access_token
		  	_self.access_token = data.access_token;
		  	//凭证有效时间，单位：秒
		  	_self.expires_in = data.expires_in;
		  	//保存到我们凭证
		  	_self.saveAccessToken(data);
	  		//验证通过,继续传递下去
	  		//Promise.resolve(data);
	  	}else{
	  		//验证不通过,重新更新access_token
	  		return _self.updateAccessToken();
	  	}
	  });
//	  .then(function(data){
//	  	console.log('成功获取到有效的凭证');
//	  	console.log(data);
//	  	//能过上面的获取与验证,我们可以获取到正确的access_token
//	  	_self.access_token = data.access_token;
//	  	//凭证有效时间，单位：秒
//	  	_self.expires_in = data.expires_in;
//	  	//保存到我们凭证
//	  	_self.saveAccessToken(data);
//	  });
}

/**下面来实现对应的方法 **/

//1.验证方法
Wechat.prototype.isValidAccessToken = function (data){
	if(!data || !data.access_token || !data.expires_in){
		return false;
	}
	//获取数据
	var access_token = data.access_token;
	var expires_in = data.expires_in;
	//获取当前时间
	var now = (new Date().getTime());
	if(now < expires_in){
		//表示 还没有过期
		return true;
	}else{
		return false;
	}
}

//2.更新方法
Wechat.prototype.updateAccessToken = function(){
	var appID = this.appID;
	var appSecret = this.appSecret;
	var urlAT = this.urlAccessToken + '&appid=' + appID + '&secret=' + appSecret;
	
	//配置发送请求
	var reqCon = {
		url : urlAT,
		json : true
	};
	//封装请求
	return new Promise(function(resolve,reject){
		console.log('正在请求access_token');
		//发送get请求
		request(reqCon)
			.then(function(response){
				//console.log(response);
				//console.log(body);
				console.log('正在获取凭据,结果如下:');
				console.log(response['body']);
				//console.log(response[1]);
				var data = response['body'];
				var now = (new Date().getTime());
				//考虑到会有延迟问题,所以我们设置 提前30秒刷新
				var expire_in = now + (data.expires_in - 30)*1000;
				
				//把新的有效时间 传到data当中
				data.expires_in = expire_in;
				//成功就传递
			    resolve(data);
			});
	});
	
}

module.exports = function(opts){
	//调用 获取acccss_token
	var wechat = new Wechat(opts);
	return function *(next){
		console.log('成功获取到用户信息');
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
		console.log('成功组装之后的签名:'+sha);
		//判断是验证请求还是用户请求
		if(this.method === 'GET'){
			if(sha === signature){
				this.body = echostr+ '';
				console.log('验证成功!');
			}else{
				this.body = 'error';
				console.log('验证失败!');
			}
		}else if(this.method === 'POST'){
			//判断签名是否正确
			if(sha !== signature){
				this.body = 'error';
				console.log('验证失败!');
				return false;
			}
			//yield 表示 退出,并保留上下文,意思就是说我这是x=2,我在X=2的时候,我退出了,我下次进来 x从2开始
			var data = yield getRawBody(this.req,{
				length : this.length,
				limit : '1mb',
				encoding : this.charset
			});
			console.log('成功接收到用户请求信息');
			console.log(data.toString());
			//获取用户发送的请求信息
			var content = yield util.parseXMLAsync(data);
			
			console.log('成功解析(第一次),内容如下:');
			console.log(content);
			console.log('成功解析(第二次),内容如下:');
			var message = util.formatMessage(content.xml);
			console.log(message);
		}
	}
}
