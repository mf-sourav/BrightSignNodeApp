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
var gallery = null;
var mediaListArray = [];
var mediaCounter = 0;
var mediaTimer = null;
var errMsg = null;
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
  openModalListner();
  //dom elemnts init
  iframe = document.getElementById('ifr');
  gallery = document.getElementById('gallery');
  document.getElementById('gallery-video').addEventListener('ended', videoEndHandler, false);
  errMsg = document.getElementById("modalErr");
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      configData = JSON.parse(this.responseText);
      console.log(configData);
      if (configData.mode == 'screen') {
        if (configData.screen != '') {
          iframe.src = 'https://screen-cloud.insteo.com/' + configData.screen;
          iframe.style.display = "block";
        } else {
          openModal();
        }
      } else {
        if (configData.vfk != '') {
          gallery.style.display = "block";
          setTimeout(getMediaList);
          setInterval(function () {
            getMediaList();
          }, 300000);
          //getMediaList();
        } else {
          openModal();
        }
      }

    }
  };
  xhttp.open("GET", localHostAddress + "getConfig", true);
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
  var newPassword = document.getElementById("newpass").value;
  if (password == configData.pass) {
    //check for new pass
    if(newPassword != ''){
      if (newPassword.length >= 5) {
        configData.pass = newPassword;
      }else{
        errMsg.innerHTML = "invalid new password/leave blank to use old";
        return false;
      }
    }
    changeScreenUrl();
  } else {
    document.getElementById("pass").value = '';
    errMsg.innerHTML = "wrong password";
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
  //validations
  var screenUrl = document.getElementById("screenid").value;
  if (screenUrl == '') {
    errMsg.innerHTML = "screen id cant be empty";
    return false;
  }
  var vfk = document.getElementById("vfkid").value;
  if (vfk == '') {
    errMsg.innerHTML = "vfk cant be empty";
    return false;
  }
  var k = document.getElementById("kid").value;
  if (k == '') {
    errMsg.innerHTML = "vfk cant be empty";
    return false;
  }
  var mode = document.querySelector('input[name="mode"]:checked').value;
  if (mode == '') {
    errMsg.innerHTML = "mode cant be empty";
    return false;
  }

  configData.screen = screenUrl;
  configData.vfk = vfk;
  configData.k = k;
  configData.mode = mode;
  console.log(configData);

  if (configData.mode == 'screen') {
    iframe.style.display = "block";
    iframe.src = 'https://screen-cloud.insteo.com/' + configData.screen;
  } else {
    gallery.style.display = "block";
    getMediaList();
  }

  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      //document.getElementById("demo").innerHTML = this.responseText;
      console.log(this.responseText);
      closeModal();
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
      //modal.style.display = "none";
    }
  }

}
//open modal
function openModal() {
  modal.style.display = "block";
  getCurrentConfig();
}
//closes modal
function closeModal() {
  modal.style.display = "none";
}

/**
 *  @function getMediaList
 *  @summary
 *    gets the list of media that are downloaded & present in sdcard
 *    starts carousel if media present else tries to fetch list after some time
 *  @returns void
 */
function getMediaList() {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      mediaListArray = JSON.parse(this.responseText);
      console.log(mediaListArray);
      if (mediaListArray.length > 1) {
        //gallery.innerHTML = "";
        document.querySelector("#loading").style.display = 'none';
        document.querySelector("#gallery-video").src = "";
        document.querySelector("#gallery-image").src = ""
        clearTimeout(mediaTimer);
        nextMedia();
      } else {
        setTimeout(getMediaList, 10000);
      }
    }
  };
  xhttp.open("GET", localHostAddress + "getmedia", true);
  xhttp.send();
}

/**
 *  @function nextMedia
 *  @summary
 *    regulates the carousel function in player
 *    checks the type of media & puts in respective element
 *  @returns void
 */
function nextMedia() {

  if (mediaCounter >= mediaListArray.length) {
    mediaCounter = 0;
  }
  ext = getmediaExtension(mediaListArray[mediaCounter]);
  if (ext == '') {
    mediaCounter++;
    nextMedia();
    return false;
  }
  if (ext == 'jpg' || ext == 'jpeg' || ext == 'png' || ext == 'gif') {
    //gallery.innerHTML = "<img src='media/" + mediaListArray[mediaCounter] + "' />";
    document.querySelector("#gallery-image").src = "media/" + mediaListArray[mediaCounter];
    document.querySelector("#gallery-video").src = "";
    mediaTimer = setTimeout(nextMedia, 10000);
  }
  if (ext == 'mp4' || ext == 'webm' || ext == 'ogg') {
    //gallery.innerHTML = "<video width='1920px' autoplay src='media/" + mediaListArray[mediaCounter] + "' />";
    document.querySelector("#gallery-video").src = "media/" + mediaListArray[mediaCounter];
    document.querySelector("#gallery-image").src = ""
  }
  mediaCounter++;
}

//get media extension
function getmediaExtension(filename) {
  return filename.split('.').pop();
}

//after video over
function videoEndHandler(e) {
  mediaCounter++;
  nextMedia();
}

//press ctrl+c to open config panel
function openModalListner() {
  document.addEventListener('keydown', function (event) {
    if (event.ctrlKey && event.key === 'c') {
      event.preventDefault();
      openModal();
    }
  });
}

/**
 *  @function clearMedia
 *  @summary
 *    instructs the local node server to clear media files
 *  @returns void
 */
function clearMedia(){
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      //mediaListArray = JSON.parse(this.responseText);
      console.log(this.responseText);
      if (this.responseText == 'cleared') {
        errMsg.innerHTML = "cleared all data system will reboot";
        setTimeout(function(){
          window.location.reload();
        },3000);
      } else {
        errMsg.innerHTML = "error couldn't delete";
      }
    }
  };
  xhttp.open("GET", localHostAddress + "clearMedia", true);
  xhttp.send();
}

/**
 *  @function getCurrentConfig
 *  @summary
 *    shows present app configuration when config panel is opened
 *  @returns void
 */
function getCurrentConfig(){
  document.getElementById("screenid").value = configData.screen;
  document.getElementById("vfkid").value = configData.vfk;
  document.getElementById("kid").value = configData.k;
  if(configData.mode == "screen"){
    document.getElementById("mode1").checked = true;
  }else{
    document.getElementById("mode2").checked = true;
  }
}