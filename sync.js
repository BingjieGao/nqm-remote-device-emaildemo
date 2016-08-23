module.exports = (function(){
  var log = require('debug')('sync');
  var request = require("request");
  var util = require('util');
  var _ = require("lodash");

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
    bulk.datasetId = data["datasetId"];
    bulk.payload = data['payload'];

    log(bulk);
    log(JSON.stringify(bulk));
    log("sending upsertMany [%d - %d bytes]",data.length, JSON.stringify(data).length);
    request({ url: url, timeout: 3600000, method: "post", headers: { authorization: "Bearer " + accessToken }, json: true, body: bulk }, function(err, response, content) {
      if (!handleError(err, response, log, cb)) {
        log("result from server: %j", response.body);
        cb(null,response);
      }
    });
  }
  /*---------------------------end upsert function ---------------------------*/
  /*--------------------------- add data function ----------------------------*/
  function addDataBulk(commandHost, accessToken,data, cb) {
    var url = util.format("%s/commandSync/dataset/data/createMany", commandHost);
    var bulk = {};
    bulk.datasetId = data["datasetId"];
    bulk.payload = data["payload"];
    log('bulk');
    log(data);
    var requestOptions =  { url: url, timeout: 3600000, method: "post",  headers: { authorization: "Bearer " + accessToken }, json: true, body: bulk };
    log("sending createMany [%d - %d bytes] to %s using token %s",data.length, JSON.stringify(data).length, url, accessToken);
    request(requestOptions, function(err, response, content) {
      if (!handleError(err, response, log, cb)) {
        log("result from server: %j", response.body);
        cb(null,response);
      }
    });
  }

  /*--------------------------- end add data funciton-------------------------*/
  function HTTPSync(config,tdxtoken){
    this._config = config;
    this._token = tdxtoken;
  }
  HTTPSync.prototype.sendData = function(dataId,dataIn,cb){
    var self = this;
    var addans = null;
    var upsertans = null;
    log('sync')
    log(JSON.parse(dataIn));
    dataIn = JSON.parse(dataIn);
    log(dataIn);
    var deletedArray = _.filter(dataIn,function(o){
      return o["flags"] == "\\deleted";
    })
    log(deletedArray);
    var addArray = _.without(dataIn,deletedArray);
    log(addArray);

    var upsertData = {
      datasetId:dataId,
      payload:addArray
    }
    var deletedPayload = [];
    _.forEach(deletedArray,function(element){
      var patch = {
        m:"r",
        p:"flags",
        v:element["flags"]
      }
      patch = [].concat(patch);
      var source = {
        __update:patch
      };
      _.assign(element,source);
      element = _.pick(element,['uid','date','__update']);
      deletedPayload.push(element);
    })

    log(deletedPayload);
    log(JSON.stringify(deletedPayload));
    var updateData = {};
    updateData.datasetId = dataId;
    updateData.payload = deletedPayload;

    addDataBulk(self._config.commandHost,self._token,upsertData,function(err,response){
      if(err) {
        log(err);
        cb(err,null);
      }
      else {
        addans = response;
        if(upsertans!=null && addans!=null){
          log('not null ans');
          cb(null,upsertans);
        }
      }
    });
    upsertDataBulk(self._config.commandHost,self._token,updateData,function(err,response){
      if(err){
        log(err);
        cb(err,null);
      }
      else {
        upsertans = response;
        if(upsertans!=null && addans!=null){
          log('not null ans');
          cb(null,upsertans);
        }
      }
    })
  }

  return HTTPSync;
}())