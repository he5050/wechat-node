'use strict'

var config = require('../config/config');
var Wechat = require('./wechat');
var wechatApi = new Wechat(config.wechat);
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
		}else if(content === '7'){
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
		}
		this.body = reply;
	}
	yield next;
}
