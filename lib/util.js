'use strict'

var fs = require('fs');
var Promise = require('bluebird');
var tpl = require('./tpl');
//XML转成js的
var xml2js = require('xml2js');
//console.log('已成功进入util模块');
/*
 * @param fpath 文件路径
 * @param encoding 文件编码
 */
exports.readFileAsync = function(fpath,encoding){
	return new Promise(function(resolve,reject){
		//读取文件
		fs.readFile(fpath,encoding,function(err,content){
			//如果发生错误返回错误
			if(err){
				reject(err);
			}else{
				resolve(content);
			}
		});
	});
}
/*
 * @param fpath 文件路径
 * @param content 在写入新的内容
 */
exports.writeFileAsync = function(fpath,content){
	return new Promise(function(resolve,reject){
		//写入文件
		fs.writeFile(fpath,content,function(err){
			//如果发生错误返回错误
			if(err){
				reject(err);
			}else{
				resolve();
			}
		});
	});
}
/*
 * @param xml 接收用户发送的请求的,xml结构
 * @param return obj
 */
exports.parseXMLAsync = function(xml){
	return new Promise(function(resolve,reject){
		xml2js.parseString(xml,{trim:true},function(err,content){
			if(err){
				reject(err);
			}else{
				resolve(content);
			}
		});
	});
}

/*
 * @param content 进行一次解析
 * @param return obj 一维的对象
 */
exports.formatMessage=function(content){
	//空对象,用于遍历content,因为content可能会是多重嵌套
	var message = {};
	
	if(typeof content === 'object'){
		//取得所有key
		var keys = Object.keys(content);
		//循环遍历
		for(var i=0;i<keys.length;i++){
			//判断每个key所对应的值进行判断
			var item = content[keys[i]];
			var key = keys[i];
			
			//判断是否为一个数组
			if(!(item instanceof Array) || item.length === 0){
				continue;
			}
			if(item.length === 1){
				//获取当前的内容
				var val = item[0];
				
				//判断是否还存在嵌套
				if(typeof val === 'object'){
					message[key] = formatMessage(val);
				}else{
					message[key] = (val || '').trim();
				}
			}else{
				//是一个数组
				message[key] = [];
				//对数组重新进行遍历
				for(var j=0;j<item.length;j++){
					message[key].push(formatMessage(item[j]));
				}
			}
		}
	}
	return message;
}
exports.tpl = function(content,message){
	//用于临时存放回复内容
	var info = {};
	var type = 'text';
	var fromUserName = message.FromUserName;
	var toUserName = message.ToUserName;
	
	//如果是数组则是图文
	if(Array.isArray(content)){
		type = 'news';
	}
//	type = content.type || type;
	if(typeof content === 'object'){
		if(content.type !== undefined){
			type = content.type || type;
			console.log(type);
		}
	}
	info.content = content;
	info.createTime = new Date().getTime();
	info.msgType = type;
	info.toUserName = fromUserName;
	info.fromUserName = toUserName;
	
	return tpl.compiled(info);
}
