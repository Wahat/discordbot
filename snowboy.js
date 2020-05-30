const stream = require("stream");
const Detector = require('/Users/henryxu/Downloads/snowboy/').Detector;
const Models = require('/Users/henryxu/Downloads/snowboy/').Models;
const SampleRate = require('node-libsamplerate');

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
     * @param {GuildContext} context
     * @param {string} userId
     * @param {ReadableStream} input
     * @param callback
     */
    recognize(context, userId, input, callback) {
        const detectors = this.getGuildDetectors(context)
        if (detectors.has(userId)) {
            console.log(`Already have detector for ${userId}`)
            return
        }
        const detector = createRecognizer(callback)
        const StereoToMonoTransformer = new stream.Transform({objectMode: true})
        StereoToMonoTransformer._transform = function (chunk, encoding, done) {
            this.push(convertStereoToMono(chunk))
            done()
        }
        const DownSampler = new SampleRate({type: 1, channels: 1, fromRate: 48000, fromDepth: 16, toRate: 16000, toDepth: 16})
        input.pipe(StereoToMonoTransformer).pipe(DownSampler).pipe(detector)
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
        applyFrontend: false
    })
    detector.on('silence', () => {});
    detector.on('sound', buffer => {});
    detector.on('error', () => {console.log('error');});

    detector.on('hotword', function (index, hotword, buffer) {
        // <buffer> contains the last chunk of the audio that triggers the "hotword"
        // event. It could be written to a wav stream. You will have to use it
        // together with the <buffer> in the "sound" event if you want to get audio
        // data after the hotword.
        console.log('hotword', index, hotword);
        callback(hotword)
    });
    return detector
}

/**
 *
 * @param {Buffer} buffer
 * @returns {Buffer}
 */
function convertStereoToMono(buffer) {
    const newBuffer = Buffer.alloc(buffer.length / 2)
    const HI = 1
    const LO = 0
    for (let i = 0; i < newBuffer.length / 2; ++i) {
        const left = (buffer[i * 4 + HI] << 8) | (buffer[i * 4 + LO] & 0xff)
        const right = (buffer[i * 4 + 2 + HI] << 8) | (buffer[i * 4 + 2 + LO] & 0xff)
        const avg = (left + right) / 2
        newBuffer[i * 2 + HI] = ((avg >> 8) & 0xff)
        newBuffer[i * 2 + LO] = (avg & 0xff)
    }
    return newBuffer
}

module.exports.Snowboy = new Snowboy()