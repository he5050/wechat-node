var util=require('./util');
var Promise = require('bluebird');
var request = Promise.promisify(require('request'));
var fs = require('fs');
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
	this.uploadUrl = opts.prefix+opts.upload;
	//调用获取token
	this.fetchAccessToken();
	
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
	  		//console.log('凭证验证通过');
	  		//验证通过,继续传递下去
	  		return Promise.resolve(data);
	  	}else{
	  		//验证不通过,重新更新access_token
	  		return _self.updateAccessToken();
	  	}
	  })
	  .then(function(data){
	  	//console.log('成功获取到有效的凭证');
	  	//console.log(data);
	  	//能过上面的获取与验证,我们可以获取到正确的access_token
	  	_self.access_token = data.access_token;
	  	//凭证有效时间，单位：秒
	  	_self.expires_in = data.expires_in;
	  	//保存到我们凭证
	  	_self.saveAccessToken(data);
	  });
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
		//console.log('正在请求access_token');
		//发送get请求
		request(reqCon)
			.then(function(response){
				//console.log('正在获取凭据,结果如下:');
				//console.log(response['body']);
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
//3.回复方法
Wechat.prototype.reply = function(){
	//回复的消息内容
	var content = this.body;
	//使用信息
	var message = this.weixin;
	//生成回复内容模板
	var xml = util.tpl(content,message);

	this.status = 200;
    this.type = 'application/xml';
    this.body = xml;
    console.log(xml);
}
//4.获取token
Wechat.prototype.fetchAccessToken = function(data){
	var _self = this;
	//判断token是否存并有效
	if(this.access_token && this.expires_in){
		if(this.isValidAccessToken(this)){
			return Promise.resolve(this);
		}
	}
	
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
	  		//console.log('凭证验证通过');
	  		//验证通过,继续传递下去
	  		return Promise.resolve(data);
	  	}else{
	  		//验证不通过,重新更新access_token
	  		return _self.updateAccessToken();
	  	}
	  })
	  .then(function(data){
	  	//console.log('成功获取到有效的凭证');
	  	//console.log(data);
	  	//能过上面的获取与验证,我们可以获取到正确的access_token
	  	_self.access_token = data.access_token;
	  	//凭证有效时间，单位：秒
	  	_self.expires_in = data.expires_in;
	  	//保存到我们凭证
	  	_self.saveAccessToken(data);
	  	return Promise.resolve(data);
	  });
	
}
//5. 上传方法
Wechat.prototype.upload = function(type,filePath){
	var _self = this;
	//构造一个表单 文件流
	var form = {
		media : fs.createReadStream(filePath)
	}
	//
	var appID = this.appID;
	var appSecret = this.appSecret;
	var upUrl = this.uploadUrl;
	return new Promise(function(resolve,reject){
		_self.fetchAccessToken()
		.then(function(data){
		    var url = upUrl + 'access_token=' + data.access_token + '&type=' + type;
			var Op = {
				method : 'POST',
				url : url,
				formData : form,
				json : true
			};
			request(Op).then(function(response){
				var _data = response['body'];
				console.log(_data);
				if(_data){
					resolve(_data);
				}else{
					throw new Error('上传出错!');
				}
			});
		}).catch(function(err){
			reject(err);
		});
	})
}

module.exports=Wechat