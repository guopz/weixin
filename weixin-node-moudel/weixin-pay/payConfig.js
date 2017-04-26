var express = require('express');
var request = require('request');
var Q = require("q");
var crypto = require('crypto');
// 需要的参数设置 自行定义
var config = require("./config");
var router = express.Router();

/* 微信支付 */
var key = '//key为在微信商户平台(pay.weixin.qq.com)-->账户设置-->API安全-->密钥设置 ';

var WxPay = {
    getXMLNodeValue: function(node_name, xml) {
        var tmp = xml.split("<" + node_name + ">");
        console.log(3,'\n'+tmp[1]+'\n');
        var _tmp = tmp[1].split("</" + node_name + ">");
        return _tmp[0];
    },

    raw: function(args) {
        var keys = Object.keys(args);
        keys = keys.sort();
        var newArgs = {};
        keys.forEach(function(key) {
            newArgs[key] = args[key];
        });
        var string = '';
        for (var k in newArgs) {
            string += '&' + k + '=' + newArgs[k];
        }
        string = string.substr(1);
        return string;
    },

    paysignjs: function(appid, nonceStr, package, signType, timeStamp) {
        var ret = {
            appId: appid,
            nonceStr: nonceStr,
            package: package,
            signType: signType,
            timeStamp: timeStamp
        };
        var string = this.raw(ret);
        string = string + '&key=' + key;
        var sign = crypto.createHash('md5').update(string, 'utf8').digest('hex');
        return sign.toUpperCase();
    },
    paysignjsapi: function(appid, attach, body, mch_id, nonce_str, notify_url, openid, out_trade_no, spbill_create_ip, total_fee, trade_type) {
        var ret = {
            appid: appid,
            attach: attach,
            body: body,
            mch_id: mch_id,
            nonce_str: nonce_str,
            notify_url: notify_url,
            openid: openid,
            out_trade_no: out_trade_no,
            spbill_create_ip: spbill_create_ip,
            total_fee: total_fee,
            trade_type: trade_type
        };

        var string = this.raw(ret);
        console.log('ret :\n' + string +'\n' );
        
        string = string + '&key=' + key;  
        var crypto = require('crypto');
        var sign = crypto.createHash('md5').update(string, 'utf8').digest('hex');
        return sign.toUpperCase();
    },
    // 随机字符串产生函数  
    createNonceStr: function() {
        return Math.random().toString(36).substr(2, 15);
    },
    // 时间戳产生函数  
    createTimeStamp: function() {
        return parseInt(new Date().getTime() / 1000) + '';
    },
    // 此处的attach不能为空值 否则微信提示签名错误  
    order: function(_order) {
        var deferred = Q.defer();
        var appid = config.member_config.appid;
        var nonce_str = this.createNonceStr();
        var timeStamp = this.createTimeStamp();
        var url = "https://api.mch.weixin.qq.com/pay/unifiedorder";

        var formData = "<xml>";
        formData += "<appid>" + appid + "</appid>"; //appid  
        formData += "<attach>" + _order.attach + "</attach>"; //附加数据  
        formData += "<body>" + _order.body + "</body>";
        formData += "<mch_id>" + _order.mch_id + "</mch_id>"; //商户号  
        formData += "<nonce_str>" + nonce_str + "</nonce_str>"; //随机字符串，不长于32位。  
        formData += "<notify_url>" + _order.notify_url + "</notify_url>";
        formData += "<openid>" + _order.openid + "</openid>";
        formData += "<out_trade_no>" + _order.bookingNo + "</out_trade_no>"; // 建议根据当前系统时间加随机序列来生成订单号
        formData += "<spbill_create_ip>"+_order.ip+"</spbill_create_ip>";
        formData += "<total_fee>" + _order.total_fee + "</total_fee>";
        formData += "<trade_type>JSAPI</trade_type>";
        formData += "<sign>" + this.paysignjsapi(appid, _order.attach, _order.body, _order.mch_id, nonce_str, _order.notify_url, _order.openid, _order.bookingNo, _order.ip, _order.total_fee, 'JSAPI') + "</sign>";
        formData += "</xml>";
        var self = this;
        // 1
        console.log(1, '\n'+formData+'\n');
        // 调用统一下单api 获取prepay_id
        request({
            url: url,
            method: 'POST',
            body: formData
        }, function(err, response, body) {
            if (!err && response.statusCode == 200) {
                console.log(2,'\n'+body+'\n');
                var prepay_id = self.getXMLNodeValue('prepay_id', body.toString("utf-8"));
                var tmp = prepay_id.split('[');
                var tmp1 = tmp[2].split(']');
                //签名  
                var _paySignjs = self.paysignjs(appid, nonce_str, 'prepay_id=' + tmp1[0], 'MD5', timeStamp);
                var args = {
                    appId: appid,
                    timeStamp: timeStamp,
                    nonceStr: nonce_str,
                    signType: "MD5",
                    package: tmp1[0],
                    paySign: _paySignjs
                };
                deferred.resolve(args);
            } else {
                console.log(body);
            }
        });
        return deferred.promise;
    }
};

module.exports = WxPay;
