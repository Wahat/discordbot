const keys = require('../keys.js').Key
const required_config_vars = ['microsoft_token', 'microsoft_location']
const stream = require('stream')
const audioUtils = require('../audio_utils.js')

let speechToText = undefined

/**
 * https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/language-support#standard-voices
 * @param message
 * @param voice
 * @param callback
 */
function generateSpeechFromText(message, voice = "en-CA-Linda", callback) {
    if (!speechToText) {
        speechToText = require('microsoft-cognitiveservices-speech-sdk')
    }
    const speechConfig = speechToText.SpeechConfig.fromSubscription(keys.get(required_config_vars[0]),
        keys.get(required_config_vars[1]))
    speechConfig.speechRecognitionLanguage = "en-US"

    let synthesizer = new speechToText.SpeechSynthesizer(speechConfig)

    const properties = new speechToText.PropertyCollection()
    properties.setProperty('voice', voice)
    const ssml = speechToText.SpeechSynthesizer.buildSsml(message, properties)
    synthesizer.speakSsmlAsync(ssml, result => {
        const array = new Uint8Array(result.audioData)
        let duplex = new stream.Duplex();
        duplex.push(array);
        duplex.push(null);
        callback(audioUtils.convertMp3StreamToOpusStream(duplex))
        synthesizer.close();
        synthesizer = undefined;
    }, err => {
        console.trace("err - " + err);
        synthesizer.close();
        synthesizer = undefined;
    });
}

module.exports.generateSpeechFromText = generateSpeechFromText