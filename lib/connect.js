'use strict'

//引入加密
var sha1 = require('sha1');
//引入 bluebird也就是Promise对象
var Promise = require('bluebird');
//用于解析
var util = require('./util');
var tpl = require('./tpl');
var getRawBody = require('raw-body');
//返回promise之后的request 对象
var request = Promise.promisify(require('request'));
var Wechat=require('./wechat')
//console.log('成功通信微信');

module.exports = function(opts,reply){
	//调用 获取acccss_token
	var wechat = new Wechat(opts);
	return function *(next){
		var _self = this;
		//console.log(this.query);
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
		//console.log('成功组装之后的签名:'+sha);
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
			//console.log(data.toString());
			//获取用户发送的请求信息
			var content = yield util.parseXMLAsync(data);
			
			//console.log('成功解析(第一次),内容如下:');
			//console.log(content);
			//console.log('成功解析(第二次),内容如下:');
			var message = util.formatMessage(content.xml);
			//console.log(message);
			
			//成功解析之后,判断用户行为,做出对应的判断
			this.weixin = message;
			//调用 回复方法,生成 回复 内容
			yield reply.call(this,next);
			//取得当前的内容,并生成对应的XML模板返回用户
			wechat.reply.call(this);
		}
	}
}
