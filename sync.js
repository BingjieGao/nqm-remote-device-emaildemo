module.exports = (function(){
  var log = require('debug')('sync');
  var request = require("request");
  var util = require('util');

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
  /*-------------------------- upsert function -----------------------*/
  function upsertDataBulk(commandHost, accessToken,data, cb) {
    var url = util.format("%s/commandSync/dataset/data/upsertMany", commandHost);
    var bulk = {};
    data = JSON.parse(data);
    log(data);
    bulk.datasetId = data["id"];
    bulk.payload = [].concat(data["d"]);
    log(bulk.payload);
    log("sending upsertMany [%d - %d bytes]",data.length, JSON.stringify(data).length);
    request({ url: url, timeout: 3600000, method: "post", headers: { authorization: "Bearer " + accessToken }, json: true, body: bulk }, function(err, response, content) {
      if (!handleError(err, response, log, cb)) {
        log("result from server: %j", response.body);
        cb(null);
      }
    });
  }
  /*---------------------------end upsert function ---------------------------*/
  function HTTPSync(config,tdxtoken){
    this._config = config;
    this._token = tdxtoken;
  }
  HTTPSync.prototype.sendData = function(dataIn,cb){
    var self = this;
    log(self._config);
    log(self._config.commandHost);
    upsertDataBulk(self._config.commandHost,self._token,dataIn,function(err){
      if(err)
      cb(err);
      else
      cb(null);
    })

  }

return HTTPSync;
}())