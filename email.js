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
  var sendPath = "./sent.json";

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
  /*--------------------------- update function ---------------------------*/
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
  /*--------------------------- END update function ---------------------------*/
  Inbox.prototype.send = function(msgheader,msgcontent,cb){
    var self = this;
    log('send email');
    var replyTo = msgheader['uid']>0?msgheader['uid']:"";
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
      html: msgcontent['html']
    };
    var sentData = {
      "uid":msgheader['uid'],
      "modseq":'1',
      "flags":"\\Sent",
      "textcount":msgcontent["html"].length,
      "text":msgcontent["html"],
      "to":msgheader['To'],
      "from":"me",
      "subject":msgheader['Subject'],
      "date":Date.now()
    };

    if(msgcontent['attachments'].length>0){
      var attachArray = [];
      _.forEach(msgcontent['attachments'],function(o){
        var attachfileObj = {
          filename:o['docName'],
          path:"./public/docViews/"+o['docId']
        }
        attachArray.push(attachfileObj);
      })
      var attach = {
        attachments:attachArray
      }
      _.assign(mailOptions,attach);
      _.assign(sentData,attach);
    }

    log('sent results are');

    if(replyTo.length>0){
      var InReplyTo = {
        "In-Reply-To":replyTo
      }
      _.assign(mailOptions,InReplyTo);
      _.assign(sentData,InReplyTo);
    }
    var sentObj = {
      id:self._config.byodimapboxes_ID,
      d:sentData
    }
    log(sentObj);
    log(mailOptions);
    cb('err',sentObj);

    //transporter.sendMail(mailOptions,function(err,info){
    //  if(err){
    //    log(err);
    //    cb(err,sentObj);
    //  }
    //  else {
    //    cb(null, info.response);
    //  }
    //})
  }
  /*--------------------------- END send function ----------------------------*/
  Inbox.prototype.getAttachmentsList = function(tdxToken,cb){
    var self = this;
    self._tdxAPI.query("datasets/" + self._config.byodattachment_ID + "/data", null, null, null, tdxToken,function (qerr, data) {
      if(qerr) {
        log(qerr);
        cb(qerr,null);
      }
      else{
        log('attachemnt ids are ');
        fs.writeFile('attachments.json',JSON.stringify(data,null,4),{encoding:"utf8",flag:"w"},function(err){
          if(err)
            cb(err,null);
          else
            cb(null,data);
        });
      }
    })
  }
  return Inbox;
}())