'use strict'
//使用严格模式

var Koa = require('koa');
//引入验证
var con = require('./lib/connect');
//引入配置
var config = require('./config/config');
//实例化
var app = new Koa();
//使用链接中间件
app.use(con(config.wechat));

//监听端口3001
app.listen(3001);
console.log('服务运行在3001端口');
// 使用node-harmony app.js,启动服务