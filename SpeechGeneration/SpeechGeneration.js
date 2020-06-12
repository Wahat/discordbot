const microsoft = require('./microsoft.js')
const say = require('./say.js')

const engines = [microsoft, say]
const keys = require('../keys.js').Key

class SpeechGeneration {
    generateSpeechFromText(message, voice, callback) {
        for (let i = 0; i < engines.length; i++) {
            let hasRequiredKeys = true
            for (let j = 0; j < engines[i].required_config_vars; j++) {
                if (!keys.get(engines[i].required_config_vars[j])) {
                    hasRequiredKeys = false
                    break
                }
            }
            if (hasRequiredKeys) {
                engines[i].generateSpeechFromText(message, voice, callback)
                return true
            }
        }
        return false
    }
}

module.exports.SpeechGeneration = new SpeechGeneration()