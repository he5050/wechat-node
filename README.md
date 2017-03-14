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
		console.log('服务已成功运行,监听在3001端口');
		// 使用node --harmony app.js,启动服务
		

- 1.3. `第三步`,接下来我们要启动,我们的服务。使用`node --harmony app.js`,启动服务效果如下:

服务成功启动。打开`chrome`,输入`127.0.0.1:3001`,会显示`Not Found`,我们输入`127.0.0.1:3001?a=1`

![](http://p1.bpimg.com/567571/1588a8efaccd67b9.png)

OK了,我们可以正常的获取到相关的参数,并服务也成功启动,接下来配置我们进行配置,使我们能与微信通信,我们先来获取一下参数

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
		console.log('服务已成功运行,监听在3001端口');
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
 我们的配置文件，一个用于存放我们连接验证文件
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
				
				//微信服务器进行验证带过来的秘钥
				var signature = this.query.signature;
				//随机数
				var nonce = this.query.nonce;
				//时间戳
				var timestamp = this.query.timestamp;
				//随机字符串
				var echostr = this.query.echostr;
				
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
			//使用微信验证中间件
			app.use(con(config.wechat));
			
			//监听端口3001
			app.listen(3001);
			console.log('服务已成功运行,监听在3001端口');
			// 使用node-harmony app.js,启动服务


> 有没有发现，我们现在的代码更加的简洁了,每个模块处理对应的功能。


***

- 2.2. 对`app.js`,进行封装分离之后,我们下面在来接触一个内容,关于`access_token`

下面是从[官方文档](https://mp.weixin.qq.com/wiki)摘写关于`access_token`的描述。

> `access_token`是公众号的全局唯一接口调用凭据,公众号调用各接口时都需使用`access_token`。
开发者需要进行妥善保存。`access_token`的存储至少要保留512个字符空间。
`access_token`的有效期目前为2个小时，需定时刷新，重复获取将导致上次获取的`access_token`失效。


  看了上面的说明,我们要注意一下我们获取到的`access_token`,是有时效性的,但是我们又不能频繁的去刷新调用。
所以,我们要实现一个功能,定时去获取`access_token`,并将其存放到一个固定文本中。

那 么我们接下实现,如何成功的获取到`access_token`
- 我们先在`config`目录下新创建一个`wechat.txt`的文件,用于本地存放`凭证`。
- 在`lib`目录创建一个我们自定义的`util`模块,用于操作`wechat.txt`的读写。
- 现在我们对`config.js`进行配置,具体如下:

		
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


>  这里面的有一个两个方法`getAccessToken`与`saveAccessToken`,是我们自定义的方法,用于读取与写入我们`凭证`
>  另外`util`当中,两上方法`readFileAsync`与`writeFileAsync`这两个方法就是用于具体的操作,我们在后面详细说明,其具体内容


- 接下来我们来实现`util`,具体如下:

		
		'use strict'
		
		var fs = require('fs');
		var Promise = require('bluebird');
		console.log('已成功进入util模块');
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


> 完成上面的准备工作之后,我们只需要在我们用于微信连接的`conncet.js`,当中实现获取就行了


- 打开`conncet.js`,创建一个方法`wechat`,用于获取、验证、保存`凭证`


							
				'use strict'
				
				//引入加密
				var sha1 = require('sha1');
				//引入 bluebird也就是Promise对象
				var Promise = require('bluebird');
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
			

下面,我们在实现`isValidAccessToken`和`updateAccessToken`,这两个方法一个是用于验证是否有效,一个用于更新

`updateAccessToken`方法,主要是用于从微信服器上面获取`凭证`。这里要注意一下,我们在获取到了`凭证`,对`expires_in`进行了处理,处理之后在才保存到我们的`wechat.txt`里面


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


`isValidAccessToken`方法,主要是用于验证`凭证是否存在`与`凭证是否过期`。

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
				console.log(now);
				if(now < expires_in){
					//表示 还没有过期
					return true;
				}else{
					return false;
				}
			}


对上面的进行了修改之后,我们来看下效果:

![](http://i1.piimg.com/567571/f785f1904b2613b7.png)

***

2.3. 前面的基础准备工作都好了,我们接下来实现如何接收用户的输入或请求信息呢?

打开我们的`connect.js`,进行如下修改:


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

这里我们在我们工具包里面定义了两个方法`parseXMLAsync`,`formatMessage`,都用于解析用户输入的。因为微信使用的
数据结构是`xml`,而且会存在嵌套问题。所以我们会对进行两次解析。我们在`util.js`里面实现上面的两个方法。
这里我们用到一个`xml2js`的模块,所以要入到项目当中。



			
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

> 其实简单点就直接使用content.xml就得到了一维的**OBJ**



**看下结果吧:**


![](http://p1.bpimg.com/567571/49b0fb254663fcde.png)

***

2.3. 前面说了这么多,来开始实战吧!,我们实现一个简单的关注功能自动回复功能!

打开`connect.js`进行如下修改,在message后面添加以下内容:

	//成功解析之后,判断用户行为,做出对应的判断
			
			if(message.MsgType === 'event'){
				//如果是关注行为
				if(message.Event === 'subscribe'){
					console.log('有新的用户,关注了您!');
					var now = new Date().getTime();
					var msg = '感谢您的关注!';
					_self.status = 200;
					_self.type = 'application/xml';
					var replyMsg = "<xml>";
					replyMsg += "<ToUserName><![CDATA["+message.FromUserName+"]]></ToUserName>";
					replyMsg += "<FromUserName><![CDATA["+message.ToUserName+"]]></FromUserName>";
					replyMsg += "<CreateTime>"+now+"</CreateTime>";
					replyMsg += "<MsgType><![CDATA[text]]></MsgType>";
					replyMsg += "<Content><![CDATA["+msg+"]]></Content>";
					replyMsg += "</xml>";
					_self.body = replyMsg;
					console.log(replyMsg);
					//直接return返回
					return ;
				}else{
					console.log('尴尬的是,又有用户离开你了!');
				}


成功关注后的效果如下:

![](http://p1.bqimg.com/567571/8938e500aa8020a9.png)

> 关于这个回复体的结构,请参考官方文档


-  2.4. 实现了简单的关注功能后,我们是不是发现有两个问题

  - 第一点是:这断XML代码的使用太麻烦了,而且不可复用。
  - 第二点是:我们的`connect.js`文件,文件太复杂我们要把关于`wechat`这个类都独立出来
  
  我们在`lib`下面创建`wechat.js`,内容如下:
  
		var util=require('./util');
		var Promise = require('bluebird');
		var request = Promise.promisify(require('request'));
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
		
		
		module.exports=Wechat


在我们`connect.js`当中引入`wechat`这个文件;
下面我们还要来解决代码复用的问题
我们创建一个`tpl.js`,使用了`ejs`做为我们的模板引擎

			'use strict'
			
			var ejs = require('ejs');
			var heredoc = require('heredoc');
			
			var tpl = heredoc(function(){/*
				<xml>
					<ToUserName><![CDATA[<%= fromUserName %>]]></ToUserName>
					<FromUserName><![CDATA[<%= toUserName %>]]></FromUserName>
					<CreateTime><%= createTime %></CreateTime>
					<MsgType><![CDATA[<%= msgType %>]]></MsgType>
				<% if(msgType === 'text') { %>
					<Content><![CDATA[<%= content %>]]></Content>
				<% }else if(msgType === 'image'){ %>
					<Image>
						<MediaId><![CDATA[<%= content.media_id %>]]></MediaId>
					</Image>
				<% }else if(msgType === 'voice'){ %>
					<Voice>
						<MediaId><![CDATA[<%= content.media_id %>]]></MediaId>
					</Voice>
				<% }else if(msgType === 'video'){ %>
					<Video>
						<MediaId><![CDATA[<%= content.media_id%>]]></MediaId>
						<Title><![CDATA[<%= content.title %>]]></Title>
						<Description><![CDATA[<%= content.description %>]]></Description>
					</Video> 
				<% }else if(msgType === 'music'){ %>
					<Music>
						<Title><![CDATA[<%= content.title %>]]></Title>
						<Description><![CDATA[<%= content.description %>]]></Description>
						<MusicUrl><![CDATA[<%= content.MUSIC_Url %>]]></MusicUrl>
						<HQMusicUrl><![CDATA[<%= content.HQ_MUSIC_Url %>]]></HQMusicUrl>
						<ThumbMediaId><![CDATA[<%= content.media_id %>]]></ThumbMediaId>
					</Music>
				<% }else if(msgType === 'news'){ %>
					<ArticleCount><%= content.length %></ArticleCount>
					<Articles>
					 <% content.forEach(function(item){ %>
						<item>
							<Title><![CDATA[<%= item.title %>]]></Title> 
							<Description><![CDATA[<%= item.description %>]]></Description>
							<PicUrl><![CDATA[<%= item.picUrl %>]]></PicUrl>
							<Url><![CDATA[<%= item.url %>]]></Url>
						</item>
					<% }) %>	
					</Articles>
				<% } %>
				</xml>	
			*/});
			//编译模版
			var compiled = ejs.compile(tpl);
			
			exports = module.exports = {
				compiled : compiled
			}

到这里,我们把上面的问题都解决了,但是我们又发现了一个,我们的`connect.js`,就是通信验证的功能,不用说在这里写
上一大堆的回复方法,回复信息的。
基本上面的两个,我们在创建一个`weixin.js`,专门用于回复内容的。

			'use strict'
			
			exports.reply = function* (next) {
				var message = this.weixin;
				
				if(message.MsgType === 'event'){
					if(message.Event === 'subscribe'){
						if(message.EventKey){
							console.log('用户通过扫三维码进来的'+message.EventKey+'...'+message.ticket);
							this.body = "小主,我可算找到了你\r\n";
							console.log('小主,我可算找到了你\r\n');
						}else{
							this.body = "小主,我在这呢!\r\n";
							console.log('小主,我在这呢!\r\n');
						}
					}else if(message.Event === 'unsubscribe'){
						this.body = '';
						console.log('陛下,不要抛弃臣妾!');
					}else if(message.Event === 'LOCATION'){
						this.body = '您上报的地理位置纬度:: '+ message.Latitude+' 经度: '+ 
						message.Longitude+' 地理信息:'+ message.Precision;
						console.log('我和你好近哦!');
					}else if(message.Event ==='CLICK'){
						this.body = '您点击了菜单:' + message.EventKey;
						console.log('您弄疼我了!');
					}else if(message.Event === 'SCAN'){
						this.body = '您确定不陈老师' + message.EventKey+ '   ' + message.Ticket;
						console.log('扫描我了,我暴露了');
					}else if(message.Event === 'VIEW'){
						this.body = '这连接有毒吧!'+message.EventKey;
					}
				}else if(message.MsgType === 'text'){
					//回复普通文章
					var content = message.Content;
					var reply = '我好像,不是很明白' + content + '太复杂';
					if(content === '1'){
						reply = '水';
					}else if(content === '2'){
						reply = '金';
					}else if(content === '3'){
						reply = '土';
					}else if(content === '4'){
						reply = '火';
					}else if(content === '5'){
						reply = '木';
					}else if(content === '6'){
						//回复图文
						reply = [
						{
							title : 'Range对象的使用',
							description : '有很多东西,请自行查阅',
							picUrl : 'http://img5q.duitang.com/uploads/item/201506/23/20150623203928_HzBWU.jpeg',
							url : 'http://www.hhh1989.top/a/2.html'
						},
						{
							title : 'HTML5 当中进度条 progress与meter的使用',
							description : '手动开启与停用进度条 ',
							picUrl : 'http://pic1.win4000.com/wallpaper/a/57a0131036064.jpg',
							url : 'http://www.hhh1989.top/a/1.html'
						}
						];
					}
					this.body = reply;
				}
				yield next;
			}


在我们的`wechat.js`添加一个回复方法,专门用于回复的。

		//回复方法
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


现在我们需要在我们`工具类`当中来实现`tpl`方法

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
			info.content = content;
			info.createTime = new Date().getTime();
			info.msgType = type;
			info.toUserName = toUserName;
			info.fromUserName = fromUserName;
			
			return tpl.compiled(info);
		}


结果如下:

![](http://p1.bpimg.com/567571/3031d2de6c025446.png)


一切都那么好!

-  2.5. 完成上面的功能之后,我们来实现临时文件的上传功能
 - 首先,在`config.js`添加 `upload : 'media/upload?'`, 临时素材上传接口路径
 - 打开我们`wechat.js`,在里面我们来实现上传方法
 
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

> 下面我们在我们的`weixin.js`里面实现我们上传就可以了(这里是指的临时上传)


 - 最后,打开我们`weixin.js`,添加如下代码:
 
		var config = require('../config/config');
		var Wechat = require('./wechat');
		var wechatApi = new Wechat(config.wechat);
 
			else if(content === '7'){
						//回复上传图片(临时)
						var data = yield wechatApi.upload('image',__dirname+'/../images/2.jpg');
						reply = {
							type : 'image',
							mediaId:data.media_id
						}
					}else if(content === '8'){
						//回复 上传视频(临时)
						var data = yield wechatApi.upload('video',__dirname+'/../images/1.mp4');
						reply = {
							type : 'video',
							title : '我回复了你的视频了',
							description : '很暴力的哦',
							mediaId : data.media_id
						}
					}else if(content === '9'){
						//回复 并上传音乐(临时) 因为某种
						var data = yield wechatApi.upload('image',__dirname+'/../images/2.jpg');
						reply = {
							type : 'music',
							title : '发一点音乐你听一下',
							description : '好听哦',
							MUSIC_Url : 'http://www.hhh1989.top/upload/image/20170207/tfz-zmr.mp3',
							HQ_MUSIC_Url : 'http://www.hhh1989.top/upload/image/20170207/tfz-zmr.mp3',
							mediaId : data.media_id
						}
						

我们来查看一下结果吧!

![](http://i1.piimg.com/567571/4c90fd1072d2270b.png)