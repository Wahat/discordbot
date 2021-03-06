const Detector = require('./snowboy/').Detector;
const Models = require('./snowboy/').Models;
const audioUtils = require('./audio_utils.js')

class Snowboy {
    constructor() {
        /** @member {Map<string><Map<string><Detector>>} **/
        this.guildDetectorsMap = new Map()
    }

    /**
     *
     * @param {GuildContext} context
     * @returns {*}
     */
    getGuildDetectors(context) {
        const guildId = context.getTextChannel().guild.id
        if (!this.guildDetectorsMap.has(guildId)) {
            this.guildDetectorsMap.set(guildId, new Map())
        }
        return this.guildDetectorsMap.get(guildId)
    }

    /**
     *
     * @param {string} guildId
     * @param {string} userId
     */
    remove(guildId, userId) {
        const detectors = this.guildDetectorsMap.get(guildId)
        if (detectors && detectors.has(userId)) {
            detectors.get(userId).reset()
            detectors.delete(userId)
        }
    }

    /**
     *
     * @param guildId
     */
    clearDetectors(guildId) {
        const detectors = this.guildDetectorsMap.get(guildId)
        if (detectors) {
            detectors.clear()
        }
    }

    /**
     *
     * @param {GuildContext} context
     * @param {string} userId
     * @param {Recorder | Transform} input
     * @param callback
     */
    recognize(context, userId, input, callback) {
        const detectors = this.getGuildDetectors(context)
        if (detectors.has(userId)) {
            console.log(`Already have detector for ${userId}`)
            return
        }
        const detector = createRecognizer(callback)
        input.pipe(audioUtils.createStereoToMonoTransformStream())
            .pipe(audioUtils.createDownSampleTransformStream()).pipe(detector)
        detectors.set(userId, detector);
    }
}

/**
 *
 * @returns {Models}
 */
function constructModels() {
    const models = new Models();
    models.add({
        file: 'resources/models/alexa.umdl',
        sensitivity: '0.6',
        hotwords: 'alexa',
        applyFrontend: 'true'
    });
    return models
}

/**
 *
 * @param callback
 * @returns {Detector}
 */
function createRecognizer(callback) {
    let detector = new Detector({
        resource: "resources/common.res",
        models: constructModels(),
        audioGain: 1.0,
        applyFrontend: true
    })
    // detector.on('silence', () => {});
    // detector.on('sound', buffer => {});
    // detector.on('error', () => {console.log('error');});
    detector.on('hotword', function (index, hotword, buffer) {
        // <buffer> contains the last chunk of the audio that triggers the "hotword"
        // event. It could be written to a wav stream. You will have to use it
        // together with the <buffer> in the "sound" event if you want to get audio
        // data after the hotword.
        // console.log('hotword', index, hotword);
        callback(hotword)
    });
    return detector
}

module.exports.Snowboy = new Snowboy()