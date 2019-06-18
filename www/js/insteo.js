/**
 *  @file inteo.js
 *  @author sourav chatterjee
 *  @copyright Almo Insteo 2019
 *  @summary
 *    frontend for the Brightsign player node js app
 *    checks if app is configured
 *    checks users authorization
 *    serves content through iframe
 */
var localHostAddress = window.location.href;
var configData = null;
var modal = null;
var iframe = null;

/**
 *  @function init
 *  @summary
 *    gets configuration file from node server
 *    checks if app is configured
 *  @returns void
 */
function init() {
  console.log('init');
  setModal();
  iframe = document.getElementById('ifr');
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      configData = JSON.parse(this.responseText);
      console.log(configData);
      if (configData.screen != '') {
        iframe.src = 'https://screen-cloud.insteo.com/' + configData.screen;
        iframe.style.display = "block";
      } else {
        openModal();
      }
    }
  };
  xhttp.open("GET", localHostAddress + "test", true);
  xhttp.send();
}

/**
 *  @function checkPin
 *  @summary
 *    Checks if PIN entered by user is valid 
 *  @returns void
 */
function checkPin() {
  var password = document.getElementById("pass").value;
  if (password == configData.pass) {
    changeScreenUrl();
  } else {
    document.getElementById("pass").value = '';
    document.getElementById("modalErr").innerHTML="wrong password";
  }
}

/**
 *  @function changeScreenUrl
 *  @summary
 *    changes screen url id appends to iframe
 *    requests no derver to rewrite config file with new URL
 *  @returns void
 */
function changeScreenUrl() {
  var screenUrl =  document.getElementById("screenid").value;
  if(screenUrl == ''){
    document.getElementById("modalErr").innerHTML="screen id cant be empty";
    return false;
  }
  configData.screen = screenUrl;
  console.log(configData);
  iframe.style.display = "block";
  iframe.src = 'https://screen-cloud.insteo.com/' + configData.screen;
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      //document.getElementById("demo").innerHTML = this.responseText;
      console.log(this.responseText);
    }
  };
  xhttp.open("POST", localHostAddress + "updateConfig", true);
  xhttp.setRequestHeader("Content-type", "application/json");
  xhttp.send(JSON.stringify(configData));
}

/**
 *  @function resizeWindow
 *  @summary
 *    automatically resizes window to fit screen resolution in landscape
 *    works during resize events & onload
 *  @returns void
 */
function resizeWindow() {
  var el = document.querySelector('body');
  el.style.zoom = window.innerWidth / 1920;
  el.style['-moz-transform'] = 'scale(' + window.innerWidth / 1920;
  ')';
  el.style['-moz-transform'] = '0 0';
}
//starts init after 3secs
setTimeout(init, 3000);
//resize events  connection
window.onresize = resizeWindow;
window.onload = resizeWindow;
//modal
function setModal() {
  // Get the modal
  modal = document.getElementById("configModal");

  // Get the <span> element that closes the modal
  var span = document.getElementsByClassName("close")[0];

  // When the user clicks on <span> (x), close the modal
  span.onclick = function () {
    closeModal();
  }

  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function (event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  }

}
//open modal
function openModal() {
  modal.style.display = "block";
}
//closes modal
function closeModal() {
  modal.style.display = "none";
}