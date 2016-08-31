/**
 * Created by toby on 13/10/15.
 */

var log = require("debug")("index");
var _config = require("./config.json");
var Application = require("./application");
/*Electron*/
var electron = require("electron");
var elecApp = electron.app;
elecApp.commandLine.appendSwitch("js-flags","--harmony_proxies");
Application.start(_config);

elecApp.on("ready",function(){
//  electron.commandLine.appendSwitch('js-flags','--harmony_proxies');
  var main = new electron.BrowserWindow({width:800,height:600,"web-preferences":{'plugins':true}});
  main.on("cloesd",elecApp.quit);
  main.webContents.openDevTools();
  main.loadURL("http://127.0.0.1:8125");
})


