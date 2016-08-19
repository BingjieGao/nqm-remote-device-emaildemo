module.exports = (function() {
  var log = require("debug")("email");
  var config = require("./config.json");
  var base64url = require("base64url");
  var http = require("http");
  var https = require("https");
  var gRequest = require('request');
  var querystring = require("querystring");
  var fs = require('fs');
  var google = require('googleapis');
  var _accessToken;
  var https = require('https');
  var readline = require('readline');
  var this_config = {
    "commandHost": "https://cmd.nqminds.com",
    "queryHost": "https://q.nqminds.com",
    "accessTokenTTL": 864000,
    "byodimapboxes_token":"ByeXRY3u_",
    "byodimapboxes_ID":"BkgqbMqe5",
    "byodimapboxes_Pass":"1234554321"
  }
  var Inbox = function(config){
    this._config = config;
    this._tdxAPI =  (new (require("nqm-api-tdx"))(config));
  }
  Inbox.prototype.getInbox = function(cb){
    var self = this;
    log(self._config.byodimapboxes_ID);
    log('authenticate');
    self._tdxAPI.authenticate(self._config.byodimapboxes_token, self._config.byodimapboxes_Pass, function (err, accessToken) {
      if (err == null) {
        log('err null');
        log(self._config.byodimapboxes_ID);
        self._tdxAPI.query("datasets/" + self._config.byodimapboxes_ID + "/data", null, null, null, function (qerr, data) {
          if (qerr){
            cb(qerr,null);
          }
          if(data != null){
            var data_array = data.data;
            for(var i=0;i<data_array.length-1;){
              data_array[i]['folder'] = 1;
              //data_array[i]['id'] = data_array[i]['uid'];
              //data_array[i+1]['id'] = data_array[i+1]['uid'];
              data_array[i+1]['folder'] = 2;
              i +=2;
            }
            cb(null,data_array);
          }
        });
      }
      else
        cb(err,null);
    });
  }

  Inbox.prototype.deleted = function(cb){
    log('deleted');
  }

  Inbox.prototype.send = function(Encoding,cb){
    log('send email');
  }
  return Inbox;
}())