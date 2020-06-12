const keys = require('../keys.js').Key
const required_config_vars = ['microsoft_token', 'microsoft_location']

let speechToText

function runSpeechRecognition(audioStream, callback) {
    if (!speechToText) {
        speechToText = require('microsoft-cognitiveservices-speech-sdk')
    }
    const pushStream = speechToText.AudioInputStream.createPushStream(speechToText.AudioStreamFormat.getWaveFormatPCM(48000, 16, 2));
    audioStream.on('data', arrayBuffer => {
        pushStream.write(arrayBuffer.buffer)
    }).on('end', () => {
        pushStream.close()
    })

    const audioConfig = speechToText.AudioConfig.fromStreamInput(pushStream)
    const speechConfig = speechToText.SpeechConfig.fromSubscription(keys.get(required_config_vars[0]), keys.get(required_config_vars[1]))
    speechConfig.speechRecognitionLanguage = "en-US"

    let recognizer = new speechToText.SpeechRecognizer(speechConfig, audioConfig)
    recognizer.recognized = function (s, e) {
        const result = e.result.reason === speechToText.ResultReason.NoMatch ? 'Unknown Value' : e.result.text.replace('.', '')
        callback(result)
    }

    recognizer.recognizeOnceAsync(
        function (result) {
            recognizer.close()
            recognizer = undefined;
        },
        function (err) {
            recognizer.close()
            recognizer = undefined;
        })
}

module.exports.runSpeechRecognition = runSpeechRecognition