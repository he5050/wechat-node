## 基于node的个人订阅号开发

***

###  1.  开发配置

##### 开发环境

- Node  `v6.10.0`
- Koa   `v2.1.0`

> 微信公众号接口必须以http://或https://开头，分别支持80端口和443端口。


- 1.1. `第一步`配置本地开发环境
 - 1.1.1. 获取本地80端口
  使用`80`端口,我们使有**ngrok** 有我们国内开发者**Snuny**做的,[获取80端口](https://www.ngrok.cc/)。
 - 1.1.2. 基础配置
   我们现在使用是微信测试号,进行测试。怎么进入这个测试号,请大家自行查询
   接下来创建一个项目具体如下,先进入项目里面使用`npm init`,初始化项目在执行以下命令
   
```

	npm install koa --save-dev
	npm install sha1 --save-dev

```
   
引入`koa`框架与`sha1`加密

- 1.2. `第二步`,接下来我们在项目的根目录下创建`app.js`,具体代码如下:

		'use strict'
		
		//使用严格模式
		
		var Koa = require('koa');
		var sha1 = require('sha1');
		//实例化
		
		var app = new Koa();
		
		app.use(function *(next){
			console.log(this.query);
		});
		app.listen(3001);
		console.log('服务运行在3001端口');
		// 使用node --harmony app.js,启动服务
		

- 1.3. `第三步`,接下来我们要启动,我们的服务。使用`node --harmony app.js`,启动服务效果如下:

服务成功启动。打开`chrome`,输入`127.0.0.1:3001`,会显示`Not Found`,我们输入`127.0.0.1:3001?a=1`

![](http://p1.bpimg.com/567571/1588a8efaccd67b9.png)

OK了,我们可以正常的获取到相关的参数,并服务也成功启动,接下来配置我们进行配置,使我们能与微信联通,我们先来获取一下参数

![](http://i1.piimg.com/567571/dd70c7b41d5ee4ff.png)

- 1.4.  `第四步`,打开`app.js`,进行如下配置:

		'use strict'
		
		//使用严格模式
		
		var Koa = require('koa');
		var sha1 = require('sha1');
		
		//微信配置，请替换成自己的
		var config = {
			wechat : {
				appID: 'wx1429939806f6202d',
				appsecret : '82e635147bf1759546de9367d0fdefc0',
				token : 'he50501989'
			}
		}
		
		//实例化
		
		var app = new Koa();
		
		app.use(function *(next){
			console.log(this.query);
			//获取token
			var token = config.wechat.token;
			//获取微信服务端,带来的相关验证参娄
			var signature = this.query.signature;//微信服务器进行验证带过来的秘钥
			var nonce = this.query.nonce;//随机数
			var timestamp = this.query.timestamp;//时间戳
			var echostr = this.query.echostr;//随机字符串
			
			//排序过后,组成字符串,在用sha加密
			var str = [token,timestamp,noce].sort().join('');
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
		});
		app.listen(3001);
		console.log('服务运行在3001端口');
		// 使用node-harmony app.js,启动服务

> 补充一下:我们在 `package.json`,`script`当中加入启动`"start": "node --harmony app.js"`


在使用 `SET DEBUG=* && npm start`。我们来看一下效果。
效果如下:

![](http://p1.bqimg.com/567571/088586d7e54c4fb7.png)

![](http://i1.piimg.com/567571/dd70c7b41d5ee4ff.png)


基本准备工作,我们也经做好,下面要进入整题了。

###  2.  简单入门

- 2.1. 对`app.js`,进行分离与封装
 在开始入门的时候,我们分现在`app.js`,里面东西太多了,又是验证,又是启动服务的,还有配置什么的。
 把我们对整个项目进行一下分离。在根目录下面创建两个文件夹`config`和`lib`两个文件夹。一个用于存放
 我们的配置文件，一个用户存放我们连接验证文件
 - 首页,我们把`app.js`当中的关于微信配置的内容,放入到`config/config.js`当中,具体代码如下:
 
		 //微信配置，请替换成自己的
		module.exports = {
			wechat : {
				appID: 'wx1429939806f6202d',
				appsecret : '82e635147bf1759546de9367d0fdefc0',
				token : 'he50501989'
			}
		}

 - 其次,我们把`app.js`当中关于连接验证这块的功能,单独封装起具体如下:
 
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

 - 最后,我们来修改一下我们`app.js`,具体如下:
 
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


> 有没有发现，我们现在的代码更加的简洁了,每个模块处理对应的功能。


***
***