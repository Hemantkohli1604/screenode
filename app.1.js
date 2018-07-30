const electron = require('electron')
const {remote} = electron
const ipc = electron.ipcRenderer
const {Menu}  = remote.require('electron')
const {desktopCapturer}  = require('electron')
var isChannelReady = false;
var isInitiator = false;
var isStarted = false;
var localStream;
var pc;
var remoteStream;

const mainMenuTemplate = [
	{
        label:'Electron',
        submenu: [
            {
                label: 'Share Screen',
                click: function (){
                    ipc.send('toggle-pref')
                }
            }
        ]    
	}
]

const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
Menu.setApplicationMenu(mainMenu);

//Page View
var pcConfig = {
  'iceServers': [{
    'urls': 'stun:stun.l.google.com:19302'
  }]
};

// Set up audio and video regardless of what devices are present.
var sdpConstraints = {
  offerToReceiveAudio: true,
  offerToReceiveVideo: true
};


$(document).ready(function (e) {
    $('button#showPage2Btn').hide();
    $('button#showPage4Btn').hide();
    $('button#showPage3Btn').hide();
    //$('button#showPage4Btn').hide();
    function showView(viewName) {
        $('.view').hide();
        $('#' + viewName).show();      
  }
  
    $('[data-launch-view]').click(function (e) {
        e.preventDefault();
        var viewName = $(this).attr('data-launch-view');
        console.log(viewName)
        /*
        if (viewName === 'page1'){
          $('button#showPage1Btn').hide();
          $('button#showPage2Btn').hide();
          $('button#showPage4Btn').hide();
          $('button#showPage3Btn').show(); 
        } 
        */ 
        if (viewName === 'page2'){
          $('button#showPage2Btn').hide();
          $('button#showPage4Btn').hide();
          $('button#showPage3Btn').show(); 
          //toggle();
          showView(viewName);
        } 
        showView(viewName);
    });
  });

// Form Element  
  let desktopSharing;

  //Refresh the images
  function refresh() {
    $('select').imagepicker({
      hide_select : true
    });
  }
  
  //add local video source thumbnails
  function addSource(source) {
    $('select').append($('<option>', {
      value: source.id.replace(":", ""),
      text: source.name
    }));
    $('select option[value="' + source.id.replace(":", "") + '"]').attr('data-img-src', source.thumbnail.toDataURL());
    refresh();
  }
  
  //Show all video sources
  function showSources() {
    desktopCapturer.getSources({ types:['window', 'screen'] }, function(error, sources) {
      for (let source of sources) {
        $('thumbnail').append( " <p> Electron <p>"  );
        console.log("Name: " + source.name);
        addSource(source);
      }     
    });
  }
  
  //Share Screen Again
  // Ready
  $(document).ready(function() {
      showSources();
      refresh();
  });
  
  //toggle on each share
//
   // document.getElementById('showPage3Btn').addEventListener('click', function(e) {
   // toggle(); 
   // });

//DONE
//ROOM CODE

const formEl = $('.form');
formEl.form({
  fields: {
    roomName: 'empty',
    username: 'empty',
  },
});

$('.submit').on('click', (event) => {
  if (!formEl.form('is valid')) {
    return false;
  }
  username = $('#username').val();
  const roomName = $('#roomName').val().toLowerCase();
  if (event.target.id === 'create-btn') {
//   getMedia(roomName);
    $('button#showPage2Btn').show();
  } else {
//    getMedia(roomName);
    $('button#showPage4Btn').show();
  }
  return false;
});

function getMedia(room){

/////////////////////////////////////////////
// Could prompt for room name:
// room = prompt('Enter room name:');

var socket = io.connect('http://localhost:8080');

if (room !== '') {
  socket.emit('create or join', room);
  console.log('Attempted to create or  join room', room);
}

socket.on('created', function(room) {
  console.log('Created room ' + room);
  isInitiator = true;
});

socket.on('full', function(room) {
  console.log('Room ' + room + ' is full');
});


socket.on('join', function (room){
  console.log('Another peer made a request to join room ' + room);
  console.log('This peer is the initiator of room ' + room + '!');
  isChannelReady = true;
});

socket.on('joined', function(room) {
  console.log('joined: ' + room);
  isChannelReady = true;
});

socket.on('log', function(array) {
  console.log.apply(console, array);
});

function sendMessage(message) {
  console.log('Client sending message: ', message);
  socket.emit('message', message);
}

// This client receives a message
socket.on('message', function(message) {
  console.log('Client received message:', message);
  if (message === 'got user media') {
    maybeStart();
  } else if (message.type === 'offer') {
    if (!isInitiator && !isStarted) {
      maybeStart();
    }
    pc.setRemoteDescription(new RTCSessionDescription(message));
    doAnswer();
  } else if (message.type === 'answer' && isStarted) {
    pc.setRemoteDescription(new RTCSessionDescription(message));
  } else if (message.type === 'candidate' && isStarted) {
    var candidate = new RTCIceCandidate({
      sdpMLineIndex: message.label,
      candidate: message.candidate
    });
    pc.addIceCandidate(candidate);
  } else if (message === 'bye' && isStarted) {
    handleRemoteHangup();
  }
});

////////////////////////////////////////////////////
var localVideo = document.querySelector('#local-video');
var remoteVideo = document.querySelector('#remote-video');

toggle();
function toggle() {
  if (!desktopSharing) {
    var id = ($('select').val()).replace(/window|screen/g, function(match) { return match + ":"; });
    onAccessApproved(id);
  } else {
    desktopSharing = false;

    if (localStream)
      localStream.getTracks()[0].stop();
    localStream = null;

    //document.getElementById('showPage3Btn').hide();
    document.getElementById('showPage3Btn').innerHTML = "Share Again";

    $('select').empty();
    showSources();
    refresh();
  }
}

function onAccessApproved(desktop_id) {
  if (!desktop_id) {
    console.log('Desktop Capture access rejected.');
    return;
  }
  desktopSharing = true;
  document.getElementById('showPage3Btn').innerHTML = "Stop Sharing";
  
  console.log("Desktop sharing started.. desktop_id:" + desktop_id);
  //notify();
  navigator.webkitGetUserMedia({
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: desktop_id,
        minWidth: 1280,
        maxWidth: 1280,
        minHeight: 720,
        maxHeight: 720
        }
    }
  }, gotStream, getUserMediaError);

  function gotStream(stream) {
    localStream = stream;
    //$('#local-video').srcObject = stream;
    //document.getElementById('local-video').src = URL.createObjectURL(stream);
    document.getElementById('local-video').srcObject = localStream;
    console.log("got stream")
  ///
    sendMessage('got user media');
    if (isInitiator) {
    maybeStart();
    }
    stream.onended = function() {
      if (desktopSharing) {
        console.log("SHARE")
        toggle();
      }
    };
  }

  function getUserMediaError(e) {
    console.log('getUserMediaError: ' + JSON.stringify(e, null, '---'));
  }
}

/*
navigator.mediaDevices.getUserMedia({
  audio: false,
  video: true
})
.then(gotStream)
.catch(function(e) {
  alert('getUserMedia() error: ' + e.name);
});

function gotStream(stream) {
  console.log('Adding local stream.');
  localStream = stream;
  localVideo.srcObject = stream;
  sendMessage('got user media');
  if (isInitiator) {
    maybeStart();
  }
}
*/
var constraints = {
  video: true
};

console.log('Getting user media with constraints', constraints);

if (location.hostname !== 'localhost') {
  //requestTurn(
    //'https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913'
  //);
}

function maybeStart() {
  console.log('>>>>>>> maybeStart() ', isStarted, localStream, isChannelReady);
  if (!isStarted && typeof localStream !== 'undefined' && isChannelReady) {
    localVideo.show();
    console.log('>>>>>> creating peer connection');
    createPeerConnection();
    pc.addStream(localStream);
    isStarted = true;
    console.log('isInitiator', isInitiator);
    if (isInitiator) {
      doCall();
    }
  }
}

window.onbeforeunload = function() {
  sendMessage('bye');
};

/////////////////////////////////////////////////////////

function createPeerConnection() {
  try {
    pc = new RTCPeerConnection(null);
    pc.onicecandidate = handleIceCandidate;
    pc.onaddstream = handleRemoteStreamAdded;
    pc.onremovestream = handleRemoteStreamRemoved;
    console.log('Created RTCPeerConnnection');
  } catch (e) {
    console.log('Failed to create PeerConnection, exception: ' + e.message);
    alert('Cannot create RTCPeerConnection object.');
    return;
  }
}

function handleIceCandidate(event) {
  console.log('icecandidate event: ', event);
  if (event.candidate) {
    sendMessage({
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate
    });
  } else {
    console.log('End of candidates.');
  }
}

function handleCreateOfferError(event) {
  console.log('createOffer() error: ', event);
}

function doCall() {
  console.log('Sending offer to peer');
  pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);
}

function doAnswer() {
  console.log('Sending answer to peer.');
  pc.createAnswer().then(
    setLocalAndSendMessage,
    onCreateSessionDescriptionError
  );
}

function setLocalAndSendMessage(sessionDescription) {
  pc.setLocalDescription(sessionDescription);
  console.log('setLocalAndSendMessage sending message', sessionDescription);
  sendMessage(sessionDescription);
}

function onCreateSessionDescriptionError(error) {
  trace('Failed to create session description: ' + error.toString());
}

function requestTurn(turnURL) {
  var turnExists = false;
  for (var i in pcConfig.iceServers) {
    if (pcConfig.iceServers[i].urls.substr(0, 5) === 'turn:') {
      turnExists = true;
      turnReady = true;
      break;
    }
  }
  if (!turnExists) {
    console.log('Getting TURN server from ', turnURL);
    // No TURN server. Get one from computeengineondemand.appspot.com:
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        var turnServer = JSON.parse(xhr.responseText);
        console.log('Got TURN server: ', turnServer);
        pcConfig.iceServers.push({
          'urls': 'turn:' + turnServer.username + '@' + turnServer.turn,
          'credential': turnServer.password
        });
        turnReady = true;
      }
    };
    xhr.open('GET', turnURL, true);
    xhr.send();
  }
}

function handleRemoteStreamAdded(event) {
  console.log('Remote stream added.');
  remoteStream = event.stream;
  remoteVideo.srcObject = remoteStream;
}

function handleRemoteStreamRemoved(event) {
  console.log('Remote stream removed. Event: ', event);
}

function hangup() {
  console.log('Hanging up.');
  stop();
  sendMessage('bye');
}

function handleRemoteHangup() {
  console.log('Session terminated.');
  stop();
  isInitiator = false;
}

function stop() {
  isStarted = false;
  pc.close();
  pc = null;
}

}
