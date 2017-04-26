var express = require('express');
var request = require('request');
// 需要的参数设置 自行定义
var config = require("./config");
var WxPay = require("./payConfig");
var router = express.Router();

// 获取 code
router.get('/login', function(req,res, next){
    console.log("请求 /pay/login");
    // 获取 支付参数
    var pay_case = req.query.payCase;
    // config.member_config.appid => 公众号 appid
    // config.member_config.redirect_uri => 回调地址 http://xx.com/
    // config.member_config.secret => 公众号 secret
    
    var return_uri_access_token = config.member_config.redirect_uri+'pay/open/';  
    var state = Math.random()+'='+pay_case;

    var requrl = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid='+config.member_config.appid+'&redirect_uri='+return_uri_access_token+'&response_type=code&scope=snsapi_userinfo&state='+state+'#wechat_redirect';

    res.redirect(requrl);

});
// 获取 openid
router.get('/open', function(req, res, next) {
    console.log("请求 /pay/open");
    // 获取 code 和 payFee 参数
    var get_code = req.query.code;
    var get_state = req.query.state.indexOf('=');
    var payFee = req.query.state.substr(get_state+1);
    // 查看 get 参数 
    console.log("code - "+ get_code + "payCase - "+ payFee);
   
    var openUrl = 'https://api.weixin.qq.com/sns/oauth2/access_token?appid='+config.member_config.appid+'&secret='+config.member_config.secret+'&code='+get_code+'&grant_type=authorization_code';
   	
   	var ip = req.ip.substr(req.ip.lastIndexOf(':')+1);
   	console.log('\n ip - ' + ip + '\n');
   
    request.get({url:openUrl},function(err,response,body){
    	if(response.statusCode == 200){
    		var userinfo = JSON.parse(body);
    
    		console.log('\n Openid - '+ userinfo.openid);
    		console.log('\n 正确时返回的JSON数据包如下 \n'+ body +'\n');
    		
    		// 发送 统一下单参数
    		var orderInfo = {
    			attach:"支付测试",
    			body:"JSAPI支付测试-课程费用",
    			mch_id:config.member_config.mch_id,
    			openid:userinfo.openid,
    			total_fee: payFee,
    			notify_url:"http://xx.com/WeChat/payComplete/",
    			bookingNo: new Date().getTime(),
    			ip:ip
    		};

    		// 参数成功回调                                                
    		WxPay.order(orderInfo).then(function(data) {
		        console.log('\n 下单参数 - '+JSON.stringify(data)+'\n');
                // 成功返回 下单参数
                var url = 'http://xx.com/WeChat/index-pay.html?user=\''+ JSON.stringify(data);
                res.redirect(encodeURI(url));
		    });        

    	}
    });
    
});
// 支付成功回调接口
router.post('/WeChat/payComplete',function(req, res, next){
    var _da = '';
    req.on("data",function(data){
        /*微信服务器传过来的是xml格式的，是buffer类型，因为js本身只有字符串数据类型，所以需要通过toString把xml转换为字符串*/
        _da += data.toString("utf-8");
    });
    req.on("end",function(){
        console.log("end: " + _da);
        // todo 执行存储相关操作
    });
});
module.exports = router;
