var express = require('express');
var app = express();
var http = require('http');
app.use(express.static('www'));
const fs = require('fs');
var configData = null;
var bodyParser = require('body-parser');
var mediaApiUrl = 'https://api-cloud.insteo.com/api/1/AppService.svc/GetAppContentList?type=JSON&'
var vfk = 'c7d93938-a5bf-41';
var k = 'c84345d2-146e-4b';
var urlencodedParser = bodyParser.urlencoded({
  extended: false
})
var jsonParser = bodyParser.json();
const request = require('request');

function readConfig() {
  try {
    rawdata = fs.readFileSync('./www/config.txt');
    configData = JSON.parse(rawdata);
    console.log(configData);
  } catch (e) {
    console.log('fs err')
  }
}

function readMediaList() {
  try {
    rawdata = fs.readFileSync('./www/medialist.txt','utf8');
    mediaList = rawdata.split('\n');
    return mediaList;
  } catch (e) {
    return 'err';
  }
}

app.listen(9090, function () {
  console.log('Example app listening on port 9090!');
  downloadMedia();
});

app.get('/test', function (req, res) {
  readConfig();
  res.send(configData);
});

app.get('/getMedia', function (req, res) {
  res.send(readMediaList());
});

app.post('/updateConfig', jsonParser, function (req, res) {
  console.log(req.body);
  fs.writeFileSync('./www/config.txt', JSON.stringify(req.body));
  readConfig();
  res.send(configData);
});

var download = function (url, dest, cb) {
  var file = fs.createWriteStream(dest);
  var request = http.get(url, function (response) {
    response.pipe(file);
    file.on('finish', function () {
      file.close(cb(dest)); // close() is async, call cb after close completes.
    });
  });
}

function downloadMedia() {
  request(mediaApiUrl+'vfk='+vfk+'&k='+k+'&count=300&ran=466&time='+Math.floor(Date.now() / 1000), (err, res, body) => {
    if (err) {
      return console.log(err);
    }
    console.log(body);
    data = body.replace(/\(|\)/g, "").replace(/\)|\)/g, "");
    data = JSON.parse(data);
    //items = data[0].results;
    items = [{"image": "http://res.cloudinary.com/insteo/image/upload/a_exif/v1520985856/LandscapeHD1-o_A7jVGP.jpg" , "image-contentID": "35167" }, 
    {"image": "http://res.cloudinary.com/insteo/image/upload/a_exif/v1520985876/LandscapeHD2-o_oMaRzN.jpg" , "image-contentID": "35168" },
    {"image": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" , "image-contentID": "35169" } ];
    
    for (i = 0; i < items.length; i++) {
      console.log(items[i].image);
      fileName = getFileName(items[i].image);
      download(items[i].image, './www/media/' + fileName,postDownload);
    }
  });
}

//download('http://res.cloudinary.com/insteo/image/upload/a_exif/v1520985856/LandscapeHD1-o_A7jVGP.jpg','./www/media/test1.jpg');
function getFileName(url) {
  return (url.substring(url.lastIndexOf('/') + 1));
}
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