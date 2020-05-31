const google = require('@google-cloud/speech')
const keys = require('../keys.json')
const audioUtils = require('../audio_utils.js')

const client = new google.SpeechClient({'projectId': keys.project_id, 'keyFileName': keys.keyFileName});
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
        .on('error', error => {
            console.log(`Error when making gcloud request ${error}`)
        })
        .on('data', data => {
            callback(data.results[0].alternatives[0].transcript)
        });

    audioStream.pipe(audioUtils.createStereoToMonoTransformStream()).pipe(recognizeStream)
}

module.exports.runSpeechRecognition = runSpeechRecognition