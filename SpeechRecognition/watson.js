const SpeechToText = require('ibm-watson/speech-to-text/v1');
const auth = require('ibm-watson/auth')
const keys = require('../keys.json')

const speechToText = new SpeechToText({
    authenticator: new auth.IamAuthenticator({
        apikey: keys["watson_token"]
    }),
    url: keys["watson_url"]
});

function runSpeechRecognition(audioStream, userTag, callback) {
    const params = {
        audio: audioStream,
        contentType: 'audio/l16;rate=48000;channels=2;endianness=little-endian',
        objectMode: true,
    }
    speechToText.recognize(params, (error, response) => {
        let result = "Unknown Value"
        if (response.result.results.length > 0) {
            if (response.result.results[0].alternatives.length > 0) {
                result = response.result.results[0].alternatives[0].transcript
            }
        }
        callback(result)
    })
}

module.exports.runSpeechRecognition = runSpeechRecognition