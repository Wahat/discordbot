const speechToText = require('microsoft-cognitiveservices-speech-sdk')
const keys = require('../keys.json')

function runSpeechRecognition(audioStream, userTag, callback) {
    const pushStream = speechToText.AudioInputStream.createPushStream(speechToText.AudioStreamFormat.getWaveFormatPCM(48000, 16, 2));
    audioStream.on('data', arrayBuffer => {
        pushStream.write(arrayBuffer.buffer)
    }).on('end', () => {
        pushStream.close()
    })

    const audioConfig = speechToText.AudioConfig.fromStreamInput(pushStream)
    const speechConfig = speechToText.SpeechConfig.fromSubscription(keys.microsoft_token_1, keys.microsoft_location)
    speechConfig.speechRecognitionLanguage = "en-US"

    let recognizer = new speechToText.SpeechRecognizer(speechConfig, audioConfig)
    recognizer.recognized = function (s, e) {
        const result = e.result.reason === speechToText.ResultReason.NoMatch ? "Unknown Value" : e.result.text.replace('.', '')
        callback(result)
    };

    recognizer.recognizeOnceAsync(
        function (result) {
            recognizer.close();
            recognizer = undefined;
        },
        function (err) {
            recognizer.close();
            recognizer = undefined;
        });
}

module.exports.runSpeechRecognition = runSpeechRecognition