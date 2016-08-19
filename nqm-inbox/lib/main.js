module.exports = (function() {
  var log = require("debug")("AppProcess");
  var config = require("./config.json");
  var base64url = require("base64url");
  var http = require("http");
  var https = require("https");
  var gRequest = require('request');
  var querystring = require("querystring");
  var fs = require('fs');
  var google = require('googleapis');
  var googleAuth = require('google-auth-library');
  var _accessToken;
  var https = require('https');
  var readline = require('readline');
  var config = require("./config");
  var tdxAPI = (new (require("nqm-api-tdx"))(config));

  function AppProcess() {

  }


  AppProcess.prototype.run = function() {
    log('authenticate');
    tdxAPI.authenticate(config.byodimapboxes_token, config.byodimapboxes_Pass, function (err, accessToken) {
      if (err == null) {
        log('err null');
        tdxAPI.query("datasets/" + config.byodimapboxes_ID + "/data", null, null, null, function (qerr, data) {
          log(data['data']);
          if (qerr) throw qerr;
        });
      }
      else
      log(err);
    });
  }

  return AppProcess;

}())