module.exports = (function() {
  var log = require("debug")("email");
  var config = require("./config.json");
  var http = require("http");
  var https = require("https");
  var gRequest = require('request');
  var querystring = require("querystring");
  var fs = require('fs');
  var util = require('util');
  var https = require('https');
  var readline = require('readline');
  var nodemailer = require('nodemailer');
  var request = require("request");
  var _ = require('lodash');
  var fs = require('fs');

  var handleError = function(err, response, log, cb) {
    if (err || response.statusCode !== 200 || (response.body && response.body.error)) {
      if (!err) {
        err = new Error("[status code " + response.statusCode + "] " + ((response.body && response.body.error) || "unknown error"));
      }
      err.statusCode = response ? response.statusCode : 500;
      log("failure [%s]", err.message);
      cb(err);
      // Error handled.
      return true;
    } else {
      // No error.
      return false;
    }
  };

  var Inbox = function(config){
    this._config = config;
    this._tdxAPI =  (new (require("nqm-api-tdx"))(config));
    this._sync = null;
  }
  /*-------------------------- upsert function -----------------------*/
  function upsertDataBulk(commandHost, accessToken, datasetId, data, cb) {
    var url = util.format("%s/commandSync/dataset/data/upsertMany", commandHost);
    var bulk = {};
    bulk.datasetId = datasetId;
    bulk.payload = [].concat(data);
    log(data);
    log("sending upsertMany [%d - %d bytes]",data.length, JSON.stringify(data).length);
    request({ url: url, timeout: 3600000, method: "post", headers: { authorization: "Bearer " + accessToken }, json: true, body: bulk }, function(err, response, content) {
      if (!handleError(err, response, log, cb)) {
        log("result from server: %j", response.body);
        cb(null);
      }
    });
  }
  /*---------------------------end upsert function ---------------------------*/
  Inbox.prototype.getInbox = function(tdxToken,cb){
    var self = this;
    log(self._config.byodimapboxes_ID);
    log('authenticate');
      self._tdxAPI.query("datasets/" + self._config.byodimapboxes_ID + "/data", null, null, null, tdxToken,function (qerr, data) {
        if (qerr){
          cb(qerr,null);
        }
        if(data != null){
          var data_array = data.data;
          for(var i=0;i<data_array.length;i++){
            switch(data_array[i]["flags"]){
              case "\\deleted":
                data_array[i]['folder'] = 4;
                break;
              case "\\Seen":
                data_array[i]['folder'] = 1;
                break;
              case "\\Sent":
                data_array[i]['folder'] = 2;
            }
          }
          cb(null,data_array);
          fs.writeFile('inbox.json',JSON.stringify(data_array,null,4),{encoding:"utf8",flag:"w"},function(err){
            if(err)
            log(err);
            else
            log('save done');
          })
        }
      });
    }

  Inbox.prototype.update = function(msg,fileCache,cb){
    var self = this;
    log(self._config.commandHost);
    log('update');

    msg = JSON.parse(msg);
    log(msg['textcount']);
    var updateData = {
      uid:msg['uid'],
      textcount:msg['textcount'],
      text:msg['text'],
      flags:"\\deleted",
      modseq:msg['modseq'],
      from:msg['from'],
      to:msg['to'],
      subject:msg['subject'],
      date:msg['date']
    };
    var updateObj = {
      id:self._config.byodimapboxes_ID,
      d:updateData
    }
    //upsertDataBulk(self._config.commandHost,tdxToken,self._config.byodimapboxes_ID,updateObj,function(err){
    //  log(err);
    //  if(err)
    //    cb(err,null);
    //  else
    //  cb(null,'deleted');
    //})
    fileCache.cacheThis(updateObj,function(err){
      if(err)
      cb(err);
      else
      cb(null);
    });

  }

  Inbox.prototype.send = function(msgheader,text,cb){
    log('send email');
    var transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: 'bingjie@nquiringminds.com', // Your email id
        pass: 'bingjiegao10' // Your password
      }
    });

    var mailOptions = {
      to: msgheader['To'],
      cc: msgheader['Cc'],
      subject: msgheader['Subject'],
      html: text.html
    }

    transporter.sendMail(mailOptions,function(err,info){
      if(err){
        cb(err,null);
      }
      cb(null,info.response);
    })
  }
  return Inbox;
}())