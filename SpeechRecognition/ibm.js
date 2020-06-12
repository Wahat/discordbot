const SpeechToText = require('ibm-watson/speech-to-text/v1');
const auth = require('ibm-watson/auth')
const keys = require('../keys.js').Key

const required_config_vars = ['watson_token', 'watson_url']

const speechToText = new SpeechToText({
    authenticator: new auth.IamAuthenticator({
        apikey: keys.get(required_config_vars[0])
    }),
    url: keys.get(required_config_vars[1])
});

function runSpeechRecognition(audioStream, callback) {
    const params = {
        audio: audioStream,
        contentType: 'audio/l16;rate=48000;channels=2;endianness=little-endian',
        objectMode: true,
    }
    speechToText.recognize(params, (error, response) => {
        let result = 'Unknown Value'
        if (response.result.results.length > 0) {
            if (response.result.results[0].alternatives.length > 0) {
                result = response.result.results[0].alternatives[0].transcript
            }
        }
        callback(result)
    })
}

module.exports.runSpeechRecognition = runSpeechRecognition