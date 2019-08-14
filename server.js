require('dotenv').config();
var express = require('express');
var app = express();
var http = require('http');
var https = require('https');
app.use(express.static('www'));
var os = require('os');
var fs = require('fs');
var networkInterfaces = os.networkInterfaces();
var configData = null;
var bodyParser = require('body-parser');
var mediaApiUrl = process.env.PLAYER_MEDIA_URL;
var currMediaListLength = 0;
//var vfk = 'c7d93938-a5bf-41';
//var k = 'c84345d2-146e-4b';
var vfk = '';
var k = '';
var urlencodedParser = bodyParser.urlencoded({
  extended: false
})
var jsonParser = bodyParser.json();
const request = require('request');
const fsExtra = require('fs-extra');

function getIp() {
  return '127.0.0.1';
}

function readConfig() {
  try {
    rawdata = fs.readFileSync(process.env.PLAYER_CONFIG_PATH);
    configData = JSON.parse(rawdata);
    vfk = configData.vfk;
    k = configData.k;
    console.log(configData);
  } catch (e) {
    console.log('fs err')
  }
}

function readMediaList() {
  try {
    rawdata = fs.readFileSync(process.env.PLAYER_MEDIALIST_PATH, 'utf8');
    mediaList = rawdata.split('\n');
    currMediaListLength = mediaList.length;
    return mediaList;
  } catch (e) {
    return 'err';
  }
}

app.listen(process.env.PLAYER_PORT, function () {
  console.log('Example app listening on port 9090!');
  readConfig();
});

app.get('/getIp', function (req, res) {
  res.send(getIp());
});

app.get('/getConfig', function (req, res) {
  readConfig();
  res.send(configData);
});

app.get('/getMedia', function (req, res) {
  downloadMedia();
  res.send(readMediaList());
});

app.get('/clearMedia', function (req, res) {
  try {
    clearData();
    res.send('cleared');
  } catch (error) {
    res.send('err');
  }
});

app.post('/updateConfig', jsonParser, function (req, res) {
  console.log(req.body);
  fs.writeFileSync(process.env.PLAYER_CONFIG_PATH, JSON.stringify(req.body));
  readConfig();
  res.send(configData);
});

function download(url, dest, cb) {
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

function downloadMedia() {
  url =mediaApiUrl + 'vfk=' + vfk + '&k=' + k + '&count=300&ran=466&time=' + Math.floor(Date.now() / 1000);
  request(url, (err, res, body) => {
    if (err) {
      return console.log('offline');
    }
    console.log(body);
    try {
      data = body.replace(/\(|\)/g, "").replace(/\)|\)/g, "");
      data = JSON.parse(data);
      items = data[0].results;
      //check if new response
      console.log('currmedialen:'+currMediaListLength);
      console.log('newmedialen:'+items.length);
      if(currMediaListLength-1 != items.length){
        //resets the media list
        fs.writeFileSync(process.env.PLAYER_MEDIALIST_PATH, '');
      }
    } catch (e) {
      return false;
    }
    // items = [{"image": "http://res.cloudinary.com/insteo/image/upload/a_exif/v1520985856/LandscapeHD1-o_A7jVGP.jpg" , "image-contentID": "35167" }, 
    // {"image": "http://res.cloudinary.com/insteo/image/upload/a_exif/v1520985876/LandscapeHD2-o_oMaRzN.jpg" , "image-contentID": "35168" },
    // {"image": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" , "image-contentID": "35169" } ];

    for (i = 0; i < items.length; i++) {
      console.log(items[i].image);
      fileName = getFileName(items[i].image);
      download(items[i].image, process.env.PLAYER_MEDIA_PATH + fileName, postDownload);
    }
  });
}

function getFileName(url) {
  return (url.substring(url.lastIndexOf('/') + 1));
}

function postDownload(file) {
  fileName = getFileName(file);
  mediaList = readMediaList();
  if (!mediaList.includes(fileName)) {
    console.log('not present')
    fs.appendFileSync(process.env.PLAYER_MEDIALIST_PATH, fileName + '\n');
  } else {
    console.log('exists')
  }
}

function clearData() {
  fs.writeFileSync(process.env.PLAYER_MEDIALIST_PATH, '');
  fsExtra.emptyDirSync(process.env.PLAYER_MEDIA_PATH);
}