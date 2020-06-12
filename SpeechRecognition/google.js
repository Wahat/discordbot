const keys = require('../keys.js').Key
const required_config_vars = ['google_project_id', 'google_keyFileName']
const audioUtils = require('../audio_utils.js')

let google

/**
 *
 * @type {SpeechClient}
 */
let client

function runSpeechRecognition(audioStream, callback) {
    if (!google || !client) {
        google = require('@google-cloud/speech')
        client = new google.SpeechClient({'projectId': keys.get(required_config_vars[0]), 'keyFileName': keys.get(required_config_vars[1])});
    }
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