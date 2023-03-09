const socket = io();

const resultDiv = document.getElementById("result");
const logDiv = document.getElementById("log");
const responseList = document.getElementById("response-list");
const startButton = document.getElementById("startButton");
const userMessage = document.getElementById("userMessage");
const audioElement = document.getElementById("audio-player");
var triggerWord = "computer";
const triggerWordInput = document.getElementById("triggerWordInput");
const triggerWordAlert = document.getElementById("triggerWordAlert");
const sendMessageButton = document.getElementById("sendMessageButton");
const speakButton = document.getElementById("speakButton");
sendMessageButton.addEventListener("click", function () {
    const message = userMessage.value;
    sendMessage(message,true);
    socket.emit("transcript", message);
    userMessage.value = "";
});
speakButton.addEventListener("click", function () {
  const utterance = new SpeechSynthesisUtterance("TTS Online");
  window.speechSynthesis.speak(utterance);
});
startButton.addEventListener("click", function () {
  startRecording();
});
triggerWordInput.addEventListener("input", function () {
    const triggerWordValue = triggerWordInput.value;
    triggerWord = triggerWordValue;
    triggerWordAlert.textContent = `The Trigger Word is: ${triggerWordValue}`;
  });
socket.on("response", function (data) {
    sendMessage(data.response,false);
    if (data.audio) {
        audioElement.src = data.audio;
        audioElement.play();
      } else {
        if ("speechSynthesis" in window) {
            const utterance = new SpeechSynthesisUtterance(data);
            window.speechSynthesis.speak(utterance);
        } else {
            console.log("no speechSynthesis");
        }
      }
});

let recognition;
let recordingStarted = false;

function startRecording() {
  recognition = new webkitSpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  recognition.onresult = function (event) {
    let interim_transcript = "";
    let final_transcript = "";
    let spokenPhrase = "";

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        final_transcript += event.results[i][0].transcript;
      } else {
        interim_transcript += event.results[i][0].transcript;
      }
    }
    if(!final_transcript.toLowerCase().includes(triggerWord)) {
        userMessage.value = final_transcript;
    }
    if (final_transcript.toLowerCase().includes(triggerWord) && !recordingStarted) {
      recordingStarted = true;
      userMessage.classList.add("recording"); // add recording class
    } else if (recordingStarted && final_transcript) {
      spokenPhrase = final_transcript.replace(triggerWord, "").trim();

      if (spokenPhrase) {
        socket.emit("transcript", spokenPhrase);
        sendMessage(spokenPhrase,true)
      }

      recordingStarted = false;
      userMessage.classList.remove("recording"); // remove recording class
      userMessage.value = "";
    }

    if (recordingStarted) {
      if (spokenPhrase) {
        socket.emit("transcript", spokenPhrase);
      }
    }
  };

  recognition.onend = function () {
      startRecording();
  };

  recognition.start();
}

startRecording();
// Show the modal dialog when the page loads
const welcomeModal = new bootstrap.Modal(document.getElementById("welcome-modal"));
welcomeModal.show();
function sendMessage(message, isUserMessage) {
    // Get the chatbox element
    const chatbox = document.querySelector('.chatbox');
  
    // Create a new chat message element for the message
    const chatMessage = document.createElement('div');
    chatMessage.classList.add('chat-message', 'mb-3');
    
    // Add appropriate classes based on whether the message is from the user or the other user
    if (isUserMessage) {
      chatMessage.classList.add('chat-right');
    } else {
      chatMessage.classList.add('chat-left');
    }
  
    // Create a chat bubble element for the message
    const chatBubble = document.createElement('div');
    chatBubble.classList.add('chat-bubble', 'p-2');
    chatBubble.innerText = message;
  
    // Add the chat bubble to the chat message
    chatMessage.appendChild(chatBubble);
  
    // Add the chat message to the chatbox
    chatbox.appendChild(chatMessage);
  
    // Scroll to the bottom of the chatbox to show the new message
    chatbox.scrollTop = chatbox.scrollHeight;
  }