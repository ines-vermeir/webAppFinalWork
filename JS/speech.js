if ('speechSynthesis' in window && 'webkitSpeechRecognition' in window || 'speechRecognition' in window) {
    console.log("spraak wordt ondersteund");
    listen();
}


function listen() {
    window.SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    let recognition = new window.SpeechRecognition();
    recognition.interimResults = true;
    recognition.maxAlternatives = 10;
    recognition.continuous = true;
    recognition.lang = 'nl-NL';

    recognition.onerror = (event) => {
        console.error(event);
    };

    recognition.onstart = () => {
        console.log('Speech recognition service has started');
    };

    recognition.onend = () => {
        console.log('Speech recognition service disconnected');
    };

    recognition.onresult = (event) => {
        var interim_transcript = '';
        var final_transcript = '';

        for (var i = event.resultIndex; i < event.results.length; ++i) {
            // Verify if the recognized text is the last with the isFinal property
            if (event.results[i].isFinal) {
                final_transcript += event.results[i][0].transcript;
            } else {
                interim_transcript += event.results[i][0].transcript;
            }
        }

        // different results
        console.log("Interim: ", interim_transcript);
        console.log("Final: ", final_transcript);
        console.log("Simple: ", event.results[0][0].transcript);
        
        // add to chat view
        console.log(final_transcript.length);
        if (!final_transcript.length == 0) {
            let chat = document.getElementById('chat');
            chat.innerHTML += '<div class="person"><h4 class= "prefix_msg">Ik: </h4><p class="intent">' + final_transcript + '</p></div>';
        }

        //TODO: go to watson here 
        //TODO: validate if he can answer -> if start / stop is said check 
        if (final_transcript.includes("test")) {
            speak(final_transcript);
            chat.innerHTML += '<div class="computer"><h4 class= "prefix_msg">Bot: </h4><p class="answer">' + "Hier komt het antwoord van Watson" + '</p></div>';

        }
    }
    finalTranscript = '';
    recognition.start();
}


function speak(text) {
    console.log("we geraken tot hier ze")
    var msg = new SpeechSynthesisUtterance(text);
    var voices = window.speechSynthesis.getVoices();
    msg.voice = voices[10]; // Note: some voices don't support altering params
    msg.voiceURI = 'native';
    msg.volume = 1; // 0 to 1
    msg.rate = 10; // 0.1 to 10
    msg.pitch = 2; //0 to 2
    msg.text = text;
    msg.lang = 'nl-NL';
    window.speechSynthesis.speak(msg);
    return;
}
