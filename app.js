const express = require("express");
require("dotenv").config();
const { Configuration, OpenAIApi } = require("openai");
const { CensorSensor } = require("censor-sensor");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const textToSpeech = require('@google-cloud/text-to-speech');
const path = require('path');
const PORT = process.env.PORT || 3000;
const openAIKey = process.env.OPENAI_API_KEY;
// Censor Stuff
const censor = new CensorSensor();
censor.disableTier(2);
censor.disableTier(3);
censor.disableTier(4);
censor.disableTier(5);
censor.addWord("pussy");
// Open AI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
// System prompt for the chatbot
var system_text_string =
  "First and foremost keep your response short and concise. We are going to have a roleplay. You will respond to all of my questions as kevbot. kevbot is the a mostly helpful, mostly snarky chatbot. kevbot has a real edgy personality. He really likes to make jokes, and say things that on the surface may sound crude or rude. His personality causes him to curse frequently and sometimes be rude to people talking to him. But everyone around here loves his personality and we can't get enough of him.";
// Google TTS
const client = new textToSpeech.TextToSpeechClient({
  projectId: process.env.GOOGLE_PROJECT_ID,
  keyFilename: './google-credentials.json',
});

// Web Server
var dir = path.join(__dirname, 'public');
app.use(express.static(dir, {
  maxAge: '1d'
}));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});
http.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
let messageArrays = {};

// Socket.io
io.on("connection", (socket) => {
  const room = 'room' + socket.id; // create a unique room for each user
  socket.join(room); // join the user to their room

  console.log("a user connected");

  // Initialize the system prompt and message array for this room
  messageArrays[room] = [{ role: "system", content: system_text_string }];

  // Send to openAI 
  socket.on("transcript", function (data) {
    console.log("Transcript: ", data);
    // Call the modified abbadabbabotSay function with a callback function
    abbadabbabotSay(data, "", "", room, function (response) {
      // Emit the response to the frontend
      io.to(room).emit("response", response); // send the response to the specific room
    });
  });

  socket.on("setSystemPrompt", function(newSystemPrompt) {
    system_text_string = newSystemPrompt;
    messageArrays[room] = [{ role: "system", content: system_text_string }];
  }); 
  socket.on("tts", function(ttsPrompt) {
    ttsSay(ttsPrompt, "", "", room, function (response) {
      // Emit the response to the frontend
      socket.emit("response", response);
    });
  });  
  socket.on("disconnect", () => {
    console.log("user disconnected from room", room);
  });
});

async function abbadabbabotSay(msg, prefix = "", postfix = "", room, callback) {
  // Set the user prefix for the message
  const messageContent = msg;
  console.log("messageContent:", messageContent);
  const newMessage = {
    role: "user",
    content: messageContent,
  };
  messageArrays[room].push(newMessage);
  console.log(`${room}'s messageArray`, messageArrays[room]);

  try {
    const response = await openai.createChatCompletion({
      model: "gpt-4-1106-preview",
      messages: messageArrays[room],
      temperature: 0.2,
      frequency_penalty: 1.0,
      presence_penalty: 1.0,
      user: "abbabox",
    });

    if (typeof response !== "undefined" && response !== null) {
      console.log(response.data);
      var censored_response = censor.cleanProfanity(
        response.data.choices[0]["message"]["content"].trim()
      );
      console.log("censored_response:", censored_response);
      // Speech stuff
      const [speech_response] = await client.synthesizeSpeech({
        input: {text: censored_response},
        voice: {languageCode: 'en-US', ssmlGender: 'NEUTRAL'},
        audioConfig: {audioEncoding: 'MP3'},
      });
      const audioContent = speech_response.audioContent.toString('base64');

      const newResponse = {
        role: "assistant",
        content: censored_response,
      };
      messageArrays[room].push(newResponse);
      //Remove the 2nd and 3rd elements if longer than 21 elements.
      if (messageArrays[room].length >= 21) {
        // Remove the 2nd and 3rd elements
        messageArrays[room].splice(1, 2);
      }
      response_object = {
        response: censored_response,
        audio: `data:audio/mp3;base64,${audioContent}`,
      };
      callback(response_object);
    } else {
      response_object = {
        response: "abbadabbabot offline",
        audio: ''
      };
      callback(response_object);
    }
  } catch (error) {
    // Handle errors from the OpenAI API
    if (error.response) {
      console.log(error.response.status);
      console.log(error.response.data);
      // Emit an error message to the frontend
    } else {
      console.log(error.message);
    }
    response_object = {
      response: "abbadabbabot offline",
      audio: ''
    };
    callback(response_object);
  }
}
async function ttsSay(msg, prefix = "", postfix = "", room, callback) {
  // Set the user prefix for the message
  const messageContent = msg;
  console.log("messageContent:", messageContent);
  const newMessage = {
    role: "assistant",
    content: messageContent,
  };
  messageArrays[room].push(newMessage);
  console.log("messageArrays", messageArrays[room]);
  try {    
      // Speech stuff
      const [speech_response] = await client.synthesizeSpeech({
        input: {text: messageContent},
        voice: {languageCode: 'en-US', ssmlGender: 'NEUTRAL'},
        audioConfig: {audioEncoding: 'MP3'},
      });
      const audioContent = speech_response.audioContent.toString('base64');

      response_object = {
        response: messageContent,
        audio: `data:audio/mp3;base64,${audioContent}`,
      };
      callback(response_object);
  } catch (error) {
    // Handle errors from the OpenAI API
    if (error.response) {
      console.log(error.response.status);
      console.log(error.response.data);
      // Emit an error message to the frontend
    } else {
      console.log(error.message);
    }
    response_object = {
      response: "tts offline",
      audio: ''
    };
    callback(response_object);
  }
}
