/**
 *  @file index.js
 *  @author sourav chatterjee
 *  @copyright Almo Insteo 2019
 *  @summary
 *    creates local server for brightsign nodejs app
 *    display user screen with id
 *    download manages & plays media files
 */

//all dependencies initialization
var express = require('express');
var app = express();
var process = require('process');
var os = require('os');
var fs = require('fs');
var networkInterfaces = os.networkInterfaces();
var configData = null;
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false })
var jsonParser = bodyParser.json();
var http = require('http');
var https = require('https');
const request = require('request');
const fsExtra = require('fs-extra');
//insteo api
var mediaApiUrl = 'https://api-cloud.insteo.com/api/1/AppService.svc/GetAppContentList?type=JSON&';
var vfk = '';
var k = '';
//player config
const PLAYER_PORT = 9090;
const PLAYER_CONFIG_PATH = './www/config.txt';
const PLAYER_MEDIA_PATH = './www/media/';
const PLAYER_MEDIALIST_PATH = './www/medialist.txt';

/**
 *  @function main
 *  @summary
 *    passed as starting function to node-server.html as starting function
 *    sets brightsign to use sd card storage
 *    creates local server at port 9090
 *  @returns void
 */
function main() {
  process.chdir('/storage/sd');
  app.use(express.static('www'));
  app.listen(PLAYER_PORT, function () {
    console.log('app listening on port 9090!');
    readConfig();
  });
}

/**
 *  @route /getConfig
 *  @method GET
 *  @returns config data
 */
app.get('/getConfig', function (req, res) {
  readConfig();
  res.send(configData);
});

/**
 *  @route /getMedia
 *  @method GET
 *  @returns medialist array
 */
app.get('/getMedia', function (req, res) {
  downloadMedia();
  res.send(readMediaList());
});

/**
 *  @route /updateConfig
 *  @method POST
 *  @returns config data
 */
app.post('/updateConfig',jsonParser, function (req, res) {
  console.log(req.body);
  fs.writeFileSync(PLAYER_CONFIG_PATH, JSON.stringify(req.body));
  readConfig();
  //res.send(configData);
  res.send(configData);
});

//
app.get('/clearMedia', function (req, res) {
  try {
    clearData();
    res.send('cleared');
  } catch (error) {
    res.send('err');
  }
});

/**
 *  @function getIp
 *  @summary
 *    gets static/DHCP address of the brightsign player
 *  @returns ipaddress
 */
function getIp() {
  try {
    return networkInterfaces.eth0[0].address;
  } catch (error) {
    return networkInterfaces.lo[0].address;
  }

}

/**
 *  @function readConfig
 *  @summary
 *   reads config.txt
 *  @returns config data
 */
function readConfig(){
  try {
    rawdata = fs.readFileSync(PLAYER_CONFIG_PATH);
    configData = JSON.parse(rawdata);
    vfk = configData.vfk;
    k = configData.k;
    console.log(configData);
  } catch (e) {
    console.log('fs err');
  }
}

/**
 *  @function download
 *  @summary
 *   downloads file from url asynchronously
 *  @callback postDownload
 *  @returns void
 */
var download = function (url, dest, cb) {
  var file = fs.createWriteStream(dest);
  var protocol = url.split('://');
  if(protocol[0] == 'http'){
    var request = http.get(url, function(response) {
      response.pipe(file);
      file.on('finish', function() {
        file.close(cb(dest));
      });
    });
  }else{
    var request = https.get(url, function(response) {
      response.pipe(file);
      file.on('finish', function() {
        file.close(cb(dest));
      });
    });
  }

}

/**
 *  @function downloadMedia
 *  @summary
 *   calls inteo api with data & feed key for medialist
 *  @returns void
 */
function downloadMedia() {
  request(mediaApiUrl + 'vfk=' + vfk + '&k=' + k + '&count=300&ran=466&time=' + Math.floor(Date.now() / 1000), (err, res, body) => {
    if (err) {
      return console.log('offline');
    }
    console.log(body);
    try {
      data = body.replace(/\(|\)/g, "").replace(/\)|\)/g, "");
      data = JSON.parse(data);
      items = data[0].results;
    } catch (e) {
      console.log('api error');
    }
    for (i = 0; i < items.length; i++) {
      console.log(items[i].image);
      fileName = getFileName(items[i].image);
      download(items[i].image, PLAYER_MEDIA_PATH + fileName, postDownload);
    }
  });
}

/**
 *  @function readMediaList
 *  @summary
 *   reads medialist.txt that contains all downloaded file names
 *  @returns medialist array
 */
function readMediaList() {
  try {
    rawdata = fs.readFileSync(PLAYER_MEDIALIST_PATH,'utf8');
    mediaList = rawdata.split('\n');
    return mediaList;
  } catch (e) {
    return 'err';
  }
}

/**
 *  @function getFileName
 *  @summary
 *   extracts filename from url
 *  @returns filename
 */
function getFileName(url) {
  return (url.substring(url.lastIndexOf('/') + 1));
}

/**
 *  @function postDownload
 *  @summary
 *   adds new file names to media list
 *   checks if file has already been downloaded
 *  @returns filename
 */
function postDownload(file){
  fileName = getFileName(file);
  mediaList = readMediaList();
  if(!mediaList.includes(fileName)){
    console.log('not present')
    fs.appendFileSync(PLAYER_MEDIALIST_PATH, fileName + '\n');
  }
  else{
    console.log('exists');
  }
}

/**
 *  @function clearData
 *  @summary
 *   deletes all media files in the directory
 *   erases medialist
 *  @returns void
 */
function clearData() {
  fs.writeFileSync(PLAYER_MEDIALIST_PATH, '');
  fsExtra.emptyDirSync(PLAYER_MEDIA_PATH);
}

//passing methods to html entry point
window.main = main;
window.getIp = getIp;
