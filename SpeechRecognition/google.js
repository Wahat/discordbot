const google = require('@google-cloud/speech')
const keys = require('../keys.js').Key
const audioUtils = require('../audio_utils.js')

const client = new google.SpeechClient({'projectId': keys.get("google_project_id"), 'keyFileName': keys.get("google_keyFileName")});
function runSpeechRecognition(audioStream, userTag, callback) {
    const request = {
        config: {
            encoding: 'LINEAR16',
            sampleRateHertz: 48000,
            languageCode: 'en-US',
        },
        interimResults: false,
    };

    const recognizeStream = client
        .streamingRecognize(request)
        .on('error', err => {
            console.error(err)
        })
        .on('data', data => {
            callback(data.results[0].alternatives[0].transcript)
        });

    audioStream.pipe(audioUtils.createStereoToMonoTransformStream()).pipe(recognizeStream)
}

module.exports.runSpeechRecognition = runSpeechRecognition