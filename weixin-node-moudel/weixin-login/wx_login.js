var router = require('express').Router();
var request = require('request');
var setting = require('../setting');

//微信登陆
router.get('/wx_login', function(req, res, next){
    // 第一步：采用oauth2授权接口获取 code
    var return_uri_access_token = setting.member_config.redirect_uri+'users/get_wx_access_token';  
    var state = Math.random();
    var requrl = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid='+setting.member_config.appid+'&redirect_uri='+return_uri_access_token+'&response_type=code&scope=snsapi_base&state='+state+'#wechat_redirect';
    res.redirect(requrl);
});

router.get('/get_wx_access_token', function(req, res, next){
    // 第二步：通过code换取网页授权access_token
    var code = req.query.code;
    request.get(
    {   
        url: 'https://api.weixin.qq.com/sns/oauth2/access_token?appid=' + setting.member_config.appid + '&secret=' + setting.member_config.secret + '&code=' + code + '&grant_type=authorization_code',

    }, function(error, response, body){
        if(response.statusCode == 200){
            // 第三步：拉取用户信息(需scope为 snsapi_userinfo)
            var data = JSON.parse(body);
            var access_token = data.access_token;
            var openid = data.openid;
            request.get(
            {
                url:'https://api.weixin.qq.com/sns/userinfo?access_token=' + access_token + '&openid=' + openid + '&lang=zh_CN',
            }, function(error, response, body){
                if(response.statusCode == 200){
                    // 第四步：根据获取的用户信息进行对应操作
                    var userinfo = JSON.parse(body);
                    // console.log(JSON.parse(body));
                    console.log('获取微信信息成功！');
                    
                    // 实际应用 返回个人信息
                    // var r = {lntype: 'weixin', lnid: userinfo.openid, lnuid: userinfo.unionid, name: userinfo.nickname,
                				// photo: userinfo.headimgurl};
                    // var rs = JSON.stringify(r); console.log('rs: ' + rs);
                    // var rss = CryptoJS.AES.encrypt(rs, "gkonlearning"); console.log('rss: ' + rss);
                    // //test
                    // var drs = CryptoJS.AES.decrypt(rss, "gkonlearning").toString(CryptoJS.enc.Utf8); console.log('drs: ' + drs);
                    // var dr = JSON.parse(drs);  console.log(dr);
                    // //--- test
                    // var url = encodeURI('http://' + setting.domain + '/index.html?status=front&info=' + rss);
                    // res.redirect(url);
                    
                    // 测试返回信息
                    
                    res.send("\
                        <h1>个人nickname："+userinfo.nickname+" </h1>\
                        <p>个人headimgurl：<img width='100px' src='"+userinfo.headimgurl+"' /></p>\
                        <p>"+userinfo.city+"，"+userinfo.province+"，"+userinfo.country+"</p>\
                        <p>个人openid ： "+userinfo.openid+"</p>\
                        <p>个人unionid ："+userinfo.unionid+"</p>\
                    ");

                }else{
                    console.log(response.statusCode);
                }
            });
        }else{
            console.log(response.statusCode);
        }
    });
});