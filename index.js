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
  });
  download('http://res.cloudinary.com/insteo/image/upload/a_exif/v1520985856/LandscapeHD1-o_A7jVGP.jpg','./www/media/test1.jpg');
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
 *  @route /updateConfig
 *  @method POST
 *  @returns config data
 */
app.post('/updateConfig',jsonParser, function (req, res) {
  console.log(req.body);
  fs.writeFileSync('./www/config.txt', JSON.stringify(req.body));
  readConfig();
  res.send(configData);
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
    console.log(configData);
  } catch (e) {
    console.log('fs err')
  }
}

window.main = main;
window.getIp = getIp;

var download = function(url, dest, cb) {
  var file = fs.createWriteStream(dest);
  var request = http.get(url, function(response) {
    response.pipe(file);
    file.on('finish', function() {
      file.close(cb);  // close() is async, call cb after close completes.
    });
  });
}