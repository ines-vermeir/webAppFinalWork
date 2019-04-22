document.addEventListener("deviceready", onDeviceReady, false);

//video chat
// var CREDENTIALS = {
//     appId: 637,
//     authKey: 'HBPTdMYwk8KsQzG',
//     authSecret: 'Dk8cHEXRzczYner'
// };
// var CONFIG = {
//     debug: { mode: 1 } // enable DEBUG mode (mode 0 is logs off, mode 1 -> console.log())
//     /*on: {
//       sessionExpired: function(handleResponse, retry) {
//
//         // call handleResponse() if you do not want to process a session expiration,
//         // so an error will be returned to origin request
//         // handleResponse();
//
//         ConnectyCube.createSession(function(error, session) {
//           retry(session);
//      });
//    }
//  }*/
// };
// ConnectyCube.init(CREDENTIALS, CONFIG);
// //TODO: fill in with database info
// var userCredentials = {login: 'ines.vermeir@student.ehb.be', password: 'admin123'};
// ConnectyCube.createSession(userCredentials, function(error, session) {
// console.log(error);
// });

//Watson
var sessionID;
var intervalConnection;
//Speech recognition & speechSynthesis
var voices;
var listenON = true;
window.SpeechRecognition;
var recognition;
//Chat view html
var chat = document.getElementById('chat');

function onDeviceReady() {
    console.log(device.platform);
    //Browser
    if(device.platform == "browser"){
      window.SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognition = new window.SpeechRecognition();
      //check if brower support
      if ('speechSynthesis' in window && 'webkitSpeechRecognition' in window || 'speechRecognition' in window) {
          console.log("spraak wordt ondersteund");
          //connectionAPI();
          //listen();
          window.location.href = "../videocall.html";
      }
    //Mobile
    }else{
      window.plugins.speechRecognition.isRecognitionAvailable(
        function(available){
            if(available){
                        // Check permission
                        window.plugins.speechRecognition.hasPermission(function (isGranted){
                          if(isGranted){
                              // Do other things as the initialization here
                             startRecognitionOnMobile();
                          }else{
                              // Request the permission
                              window.plugins.speechRecognition.requestPermission(function (){
                              // Request accepted, start recognition
                              startRecognition();
                              }, function (err){
                                console.log(err);
                              });
                            }
                          }, function(err){
                            console.log(err);
                            chat.innerHTML += '<div class="person"><h4 class= "prefix_msg"></h4><p class="intent">' + err; + '</p></div>';

                          });
                           }
        }, function(err){
            console.error(err);
        });
    }
}

//Mobile
function startRecognitionOnMobile(){
  //setVolumeMobile(0);
    window.plugins.speechRecognition.startListening(function(result){
        chat.innerHTML += '<div class="person"><h4 class= "prefix_msg"></h4><p class="intent">' + result + '</p></div>';
        //to Watson
        //sendToWatsonAPI(result);
        //setVolumeMobile(100);
        speakMobile(result);
        if(listenON){
          startRecognitionOnMobile()
        }
    }, function(err){
        console.error(err);
    }, {
        language: "nl-NL",
        showPopup: false
    });
  }
function setVolumeMobile(volume){
  window.androidVolume.setMusic(volume, false,
    function(success){
      console.log(succes);
    },
    function(error){
      console.log(error);
      chat.innerHTML += '<div class="person"><h4 class= "prefix_msg"></h4><p class="intent">' + error; + '</p></div>';

    });
}

function speakMobile(text){
  TTS.speak({
    text: text,
    locale: 'nl-NL'
  }, function () {
    console.log('Text succesfully spoken');
  }, function (reason) {
    console.log(reason);
  });
}

//Connect to Watson via API
//FUTURE: store context var before refresh session id
function connectionAPI() {

    // Create a request variable and assign a new XMLHttpRequest object to it.
    var request = new XMLHttpRequest();

    // Open a new connection, using the GET request on the URL endpoint
    request.open('GET', 'http://127.0.0.1:8080/watson', true)

    request.onerror = function () {
        var probleem = "Er is een probleem, ik kan je even niet helpen. Probeer binnen enkele minuten opnieuw door op de herlaad knop te duwen"
        chat.innerHTML += '<div class="computer"><h4 class= "prefix_msg">Bot: </h4><p class="error">' + probleem + '</p></div>';
        //speak(probleem);
    }

    request.onload = function () {
        //var data = JSON.parse(this.response)
        if (request.status >= 200 && request.status < 400) {
            sessionID = this.response;
            intervalConnection = setInterval(connectionAPI, 270000); //4.5 min to refresh token
        } else {
            console.log('error');
        }
    }

    // Send request
    request.send();
}

function sendToWatsonAPI(text) {
    if (sessionID != null) {
        // Create a request variable and assign a new XMLHttpRequest object to it.
        var request = new XMLHttpRequest();

        // Open a new connection, using the GET request on the URL endpoint
        request.open('GET', 'http://127.0.0.1:8080/watson/input?sessionID=' + sessionID + '&input=' + text, true);

        request.onload = function () {
            //var data = JSON.parse(this.response)

            if (request.status >= 200 && request.status < 400) {
                try {
                    //get answer
                    var obj = JSON.parse(this.response);
                    console.log(obj);
                    var watson = obj.output.generic[0].text;
                    //speak
                    speak(watson);
                    //add to chat
                    chat.innerHTML += '<div class="computer"><h4 class= "prefix_msg">Bot: </h4><p class="answer">' + watson + '</p></div>';
                    //reset interval
                    clearInterval(intervalConnection);
                    intervalConnection = setInterval(connectionAPI, 270000); //4.5 min to refresh token

                } catch (err) {
                    console.log(err);
                    //start listen again
                    listenON = true;
                    recognition.start();
                }
            } else {
                console.log(request.statusText);
            }
        };

        // Send request
        request.send();
    } else {
        connectionAPI();
    }
}

//Browser
//TODO: bug error: "not-allowed"
function listen() {
    if(recognition == null){
      console.log("Error: recognition");
      return
    }
    recognition.interimResults = true;
    recognition.maxAlternatives = 10;
    recognition.continuous = true;
    recognition.lang = 'nl-BE';

    recognition.onerror = function (event) {
        console.error(event);
    };

    recognition.onstart = function () {
        console.log('Speech recognition service has started');
    };

    recognition.onend = function () {
        console.log('Speech recognition service disconnected');
        if (listenON == true) {
            recognition.start();
        }
    };

    var interim_transcript = '';
    var final_transcript = '';
    recognition.onresult = function (event) {

        for (var i = event.resultIndex; i < event.results.length; ++i) {
            // Verify if the recognized text is the last with the isFinal property
            if (event.results[i].isFinal) {
                final_transcript += event.results[i][0].transcript;
            } else {
                interim_transcript += event.results[i][0].transcript;
            }
        }

        // different results
        //console.log("Interim: ", interim_transcript);
        //console.log("Final: ", final_transcript);
        //console.log("Simple: ", event.results[0][0].transcript);

        // add to chat view
        //TODO: check if final transcribe is same as previous
        console.log(final_transcript.length);
        if (!final_transcript.length == 0) {
            chat.innerHTML += '<div class="person"><h4 class= "prefix_msg"></h4><p class="intent">' + final_transcript + '</p></div>';
            listenON = false;
            recognition.stop();
            sendToWatsonAPI(final_transcript);
            final_transcript = '';
        }
    }
    recognition.start();
}

function speak(text) {
    var msg = new SpeechSynthesisUtterance(text);
    var voices = window.speechSynthesis.getVoices();
    voices.some(function (voice) {
        if (voice.lang.search("nl") != -1) {
            if (voice.lang.search("BE") != -1) {
                msg.voice = voice;
                msg.lang = voice.lang;
            } else if (voice.lang.search("NL") != -1) {
                msg.voice = voice;
                msg.lang = voice.lang;
            }
            return true;
        }
    })
    window.speechSynthesis.speak(msg);
    msg.onend = function () {
        listenON = true;
        recognition.start();
    }
    return;
}

const getVoices = () => {
    return new Promise(resolve => {
        let voices = speechSynthesis.getVoices()
        if (voices.length) {
            resolve(voices)
            return
        }
        speechSynthesis.onvoiceschanged = () => {
            voices = speechSynthesis.getVoices()
            resolve(voices)
        }
    })
}

const printVoicesList = async () => {
    ;
    (await getVoices()).forEach(voice => {
    //console.log(voice.name, voice.lang)
})
}

printVoicesList();


//start video call
// function startVideoCall(){
//   var mediaParams = {
//       audio: true,
//       video: true,
//       elementId: 'videocall' // ID of audio/video DOM element to attach a video stream to
//     };
//     var calleesIds = [101110]; // User's ids
//     var sessionType = ConnectyCube.videochat.CallType.VIDEO; // AUDIO is also possible
//     var additionalOptions = {};
//     var session = ConnectyCube.videochat.createNewSession(calleesIds, sessionType, additionalOptions);
//
//     session.getUserMedia(mediaParams, function(error, stream) {
//       if(error != null){
//         console.log(error);
//       }else{
//         var extension = {};
//         session.call(extension, function(error) {
//           console.log(error);
//         });
//       }
//     });
// }
//
// ConnectyCube.videochat.onUserNotAnswerListener = function(session, userId) {
//   //TODO: send email
// };
//
// ConnectyCube.videochat.onAcceptCallListener = function(session, userId, extension) {
//
// };
//
// ConnectyCube.videochat.onRemoteStreamListener = function(session, userID, remoteStream) {
//  // attach the remote stream to DOM element
//  session.attachMediaStream('videocallRemote', remoteStream);
// };
//
// ConnectyCube.videochat.onRejectCallListener = function(session, userId, extension) {
//
// };
//
// function stopVideoCall(){
//   var extension = {};
//   session.stop(extension);
//   //TODO: check where logout needs to be
//   ConnectyCube.logout(function(error) {
//
//   });
// }
