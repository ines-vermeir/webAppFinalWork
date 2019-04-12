document.addEventListener("deviceready", onDeviceReady, false);

//Watson
var sessionID;
var intervalConnection;
//Speech recognition & speechSynthesis
var voices;
var listenON = true;
window.SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
var recognition = new window.SpeechRecognition();

function onDeviceReady() {
    console.log(device.platform);
    //Browser
    if(device.platform == "browser"){

      //check if brower support
      if ('speechSynthesis' in window && 'webkitSpeechRecognition' in window || 'speechRecognition' in window) {
          console.log("spraak wordt ondersteund");
          connectionAPI();
          listen();
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
                              startRecognition();
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
                          });
                           }
        }, function(err){
            console.error(err);
        });

          // Get the list of supported languages
          window.plugins.speechRecognition.getSupportedLanguages(function(data){
            console.log(data); // ["es-ES","de-DE","id-ID" ........ ]
            voices = data;
          }, function(err){
            console.error(err);
          });


    }
}
function startRecognition(){
    window.plugins.speechRecognition.startListening(function(result){
        // Show results in the console
        console.log(result);
    }, function(err){
        console.error(err);
    }, {
        language: "en-US",
        showPopup: true
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
                    var chat = document.getElementById('chat');
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

function listen() {
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
        var chat = document.getElementById('chat');
        if (!final_transcript.length == 0) {
            chat.innerHTML += '<div class="person"><h4 class= "prefix_msg">Ik: </h4><p class="intent">' + final_transcript + '</p></div>';
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

    //    msg.voice = voices[10]; // Note: some voices don't support altering params
    //    msg.voiceURI = 'native';
    //    msg.volume = 1; // 0 to 1
    //    msg.rate = 10; // 0.1 to 10
    //    msg.pitch = 1; //0 to 2
    //    msg.text = text;
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


//MOBILE
// document.addEventListener('deviceready', function () {
//     this.speechRecognition.isRecognitionAvailable()
//         .then((available: boolean) => console.log(available))
//
//     // Start the recognition process
//     this.speechRecognition.startListening(options)
//         .subscribe(
//             (matches: string[]) => console.log(matches),
//             (onerror) => console.log('error:', onerror)
//         )
//
//     // Stop the recognition process (iOS only)
//     this.speechRecognition.stopListening()
//
//     // Get the list of supported languages
//     this.speechRecognition.getSupportedLanguages()
//         .then(
//             (languages: string[]) => console.log(languages),
//             (error) => console.log(error)
//         )
//
//     // Check permission
//     this.speechRecognition.hasPermission()
//         .then((hasPermission: boolean) => console.log(hasPermission))
//
//     // Request permissions
//     this.speechRecognition.requestPermission()
//         .then(
//             () => console.log('Granted'),
//             () => console.log('Denied')
//         )
//
//
//     // basic usage
//     TTS.speak('hello, world!').then(function () {
//             alert('success');
//         }, function (reason) {
//             alert(reason);
//         });
//
//     // or with more options
//     TTS.speak({
//             text: 'hello, world!',
//             locale: 'en-GB',
//             rate: 0.75
//         }).then(function () {
//             alert('success');
//         }, function (reason) {
//             alert(reason);
//         });
// }, false);
//}
