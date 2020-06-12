const google = require('./google.js')
const microsoft = require('./microsoft.js')
const ibm = require('./ibm.js')
const python = require('./python.js')

const engines = [microsoft, ibm, google, python]
const keys = require('../keys.js').Key

class SpeechRecognition {
    /**
     *
     * @param audioStream
     * @param userTag
     * @param callback
     * @returns {boolean}
     */
    runSpeechRecognition(audioStream, callback) {
        for (let i = 0; i < engines.length; i++) {
            let hasRequiredKeys = true
            for (let j = 0; j < engines[i].required_config_vars; j++) {
                if (!keys.get(engines[i].required_config_vars[j])) {
                    hasRequiredKeys = false
                    break
                }
            }
            if (hasRequiredKeys) {
                engines[i].runSpeechRecognition(audioStream, callback)
                return true
            }
        }
        return false
    }
}

module.exports.SpeechRecognition = new SpeechRecognition()