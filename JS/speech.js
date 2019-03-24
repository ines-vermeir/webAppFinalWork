var sessionID;
var voices;
if ('speechSynthesis' in window && 'webkitSpeechRecognition' in window || 'speechRecognition' in window) {
    console.log("spraak wordt ondersteund");

    connectionAPI();
    listen();
}

function connectionAPI() {
    // Create a request variable and assign a new XMLHttpRequest object to it.
    var request = new XMLHttpRequest();

    // Open a new connection, using the GET request on the URL endpoint
    request.open('GET', 'http://127.0.0.1:8080/watson', true)

    request.onload = function () {
        //var data = JSON.parse(this.response)

        if (request.status >= 200 && request.status < 400) {
            sessionID = this.response;
        } else {
            console.log('error');
        }
    }


    // Send request
    request.send()
}

function listen() {
    window.SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    var recognition = new window.SpeechRecognition();
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
        recognition.start();
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
        //TODO: stop recognition and restart after answer 
        console.log(final_transcript.length);
        var chat = document.getElementById('chat');
        if (!final_transcript.length == 0) {
            chat.innerHTML += '<div class="person"><h4 class= "prefix_msg">Ik: </h4><p class="intent">' + final_transcript + '</p></div>';
            sendToWatsonAPI(final_transcript);
            final_transcript = '';  
        }

       /* if (final_transcript.includes("test")) {
            speak(final_transcript);
            chat.innerHTML += '<div class="computer"><h4 class= "prefix_msg">Bot: </h4><p class="answer">' + "Hier komt het antwoord van Watson" + '</p></div>';
            final_transcript = '';
        }*/
    }
    recognition.start();
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
                var obj = JSON.parse(this.response);
                console.log(obj);
                var watson = obj.output.generic[0].text;
                speak(watson);
                var chat = document.getElementById('chat');
                chat.innerHTML += '<div class="computer"><h4 class= "prefix_msg">Bot: </h4><p class="answer">' + watson + '</p></div>';
                return(true);
            } else {
                console.log('Error: watson');
            }
        };

        // Send request
        request.send();
    } else {
        connectionAPI();
    }
}

function speak(text) {
    var msg = new SpeechSynthesisUtterance(text);
    var voices = window.speechSynthesis.getVoices();
    voices.some(function(voice){
      if(voice.lang.search("nl") != -1){
          if(voice.lang.search("BE") != -1){
              msg.voice = voice;
              msg.lang = voice.lang;
          } else if(voice.lang.search("NL") != -1){
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
    speechSynthesis.speak(msg);
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
  ;(await getVoices()).forEach(voice => {
    //console.log(voice.name, voice.lang)
  })
}

printVoicesList();