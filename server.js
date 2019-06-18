var express = require('express');
var app = express();
var http = require('http');
app.use(express.static('www'));
const fs = require('fs');
var configData = null;
var bodyParser = require('body-parser');
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

app.listen(9090, function () {
  console.log('Example app listening on port 9090!');
});

app.get('/test', function (req, res) {
  readConfig();
  res.send(configData);
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
      console.log('done');
      file.close(cb); // close() is async, call cb after close completes.
    });
  });
}

function downloadMedia() {
  request('https://api-cloud.insteo.com/api/1/AppService.svc/GetAppContentList?type=JSON&vfk=c7d93938-a5bf-41&k=c84345d2-146e-4b&count=300&ran=466&time=06182019130109', (err, res, body) => {
    if (err) {
      return console.log(err);
    }
    console.log(body);
    data = body.replace(/\(|\)/g, "").replace(/\)|\)/g, "");
    data = JSON.parse(data);
    items = data[0].results;
    for (i = 0; i < items.length; i++) {
      console.log(items[i].image);
      download(items[i].image, getFileName(items[i].image));
    }
  });
}

//download('http://res.cloudinary.com/insteo/image/upload/a_exif/v1520985856/LandscapeHD1-o_A7jVGP.jpg','./www/media/test1.jpg');
function getFileName(url) {
  return ('./www/media/' + url.substring(url.lastIndexOf('/') + 1));
}