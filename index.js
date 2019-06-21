/**
 *  @file index.js
 *  @author sourav chatterjee
 *  @copyright Almo Insteo 2019
 *  @summary
 *    creates local server for brightsign nodejs app
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
const request = require('request');
var testresponse = null;
//insteo api
var mediaApiUrl = 'https://api-cloud.insteo.com/api/1/AppService.svc/GetAppContentList?type=JSON&'
var vfk = '';
var k = '';

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
  app.listen(9090, function () {
    console.log('app listening on port 9090!');
    readConfig();
  });
}

/**
 *  @route /test
 *  @method GET
 *  @returns config data
 */
app.get('/test', function (req, res) {
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
  fs.writeFileSync('./www/config.txt', JSON.stringify(req.body));
  readConfig();
  //res.send(configData);
  res.send(testresponse);
});

/**
 *  @function getIp
 *  @summary
 *    gets static/DHCP address of the brightsign player
 *  @returns ipaddress
 */
function getIp() {
  return networkInterfaces.eth0[0].address;
}

/**
 *  @function readConfig
 *  @summary
 *   reads config.txt
 *  @returns config data
 */
function readConfig(){
  try {
    rawdata = fs.readFileSync('./www/config.txt');
    configData = JSON.parse(rawdata);
    vfk = configData.vfk;
    k = configData.k;
    console.log(configData);
  } catch (e) {
    console.log('fs err')
  }
}

//passing methods to html entry point
window.main = main;
window.getIp = getIp;

/**
 *  @function download
 *  @summary
 *   downloads file from url asynchronously
 *  @callback postDownload
 *  @returns void
 */
function download(url, dest, cb) {
  var file = fs.createWriteStream(dest);
  var request = http.get(url, function(response) {
    response.pipe(file);
    file.on('finish', function() {
      file.close(cb(dest));
    });
  });
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
    } catch (e) {console.log('api error');}
    for (i = 0; i < items.length; i++) {
      console.log(items[i].image);
      fileName = getFileName(items[i].image);
      download(items[i].image, './www/media/' + fileName, postDownload);
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
    rawdata = fs.readFileSync('./www/medialist.txt','utf8');
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
    fs.appendFileSync('./www/medialist.txt', fileName + '\n');
  }
  else{
    console.log('exists')
  }
}