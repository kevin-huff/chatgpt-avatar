# ChatGPT Avatar

This project is a Twitch chatbot that uses the OpenAI GPT-3 language model and Socket.io to provide a conversational AI experience for users. It also includes text-to-speech functionality using the SpeechSynthesis API.

## Installation

1. Clone the repository
2. Navigate to the project directory
3. Run `npm install`
4. Create a `.env` file in the root of the project directory and add your OpenAI API key as `OPENAI_API_KEY=your-key-here`
5. Start the server with `npm start`

## Usage

1. Open the project in your web browser at `http://localhost:3000`
2. Click the "Start Listening" button
3. Say "computer" to trigger the chatbot
4. Speak your message and wait for a response

**Note:** The `webkitSpeechRecognition` API used for voice recognition has spotty support and has only been tested in Google Chrome Version 110.0.5481.178.

## Dependencies

This project uses the following dependencies:

- `express` for the web server
- `dotenv` for environment variable management
- `openai` for the GPT-3 language model
- `socket.io` for real-time communication with the server
- `censor-sensor` for profanity detection and filtering

## Credits

This application uses the following technologies:

- Node.js
- Express.js
- Socket.io
- OpenAI
- ChatGPT

The majority of the code was generated through ChatGPT, an OpenAI-powered tool that allows users to easily create conversational agents using GPT-3.