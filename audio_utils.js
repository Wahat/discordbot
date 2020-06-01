const stream = require('stream')
const lame = require('node-lame')
const prism = require('prism-media')
const fs = require('fs')
const wav = require('wav')

/**
 *
 * @returns {Readable | module:stream.internal.Readable}
 */
function createSilenceStream() {
    const silenceReadable = new stream.Readable()
    silenceReadable._read = function(size) {
        this.push(Buffer.from([0xf8, 0xff, 0xfe]))
    }
    return silenceReadable
}

/**
 *
 * @returns {WritableStream | ReadableStream | TransformStream | module:stream.internal.Transform}
 */
function createStereoToMonoTransformStream() {
    const stereoToMonoTransformer = new stream.Transform({objectMode: true})
    stereoToMonoTransformer._transform = function (chunk, encoding, done) {
        this.push(convertStereoToMono(chunk))
        done()
    }
    return stereoToMonoTransformer
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


/**
 * Function to write discord audio stream directly to mp3
 * Options can be found {@link https://github.com/devowlio/node-lame here}
 * @param {Buffer} audioBuffer
 * @param {string} outputPath
 * @param {string} title
 * @param {string} author
 * @param callback
 */
function writeStreamToMp3File(audioBuffer, outputPath, title, author, callback) {
    const encoder = new lame.Lame({
        "output": outputPath,
        "raw": true,
        "sfreq": 48,
        "bitwidth": 16,
        "signed": true,
        "little-endian": true,
        "mode": 's',
        "meta": {
            "title": "Recording",
            "artist": author,
        }
    }).setBuffer(audioBuffer);

    encoder.encode()
        .then(() => {
            callback(null)
        })
        .catch((error) => {
            callback(error)
        });
}

/**
 *
 * @param {string} inputPath
 * @returns {ReadableStream}
 */
function convertMp3FileToOpusStream(inputPath) {
    const opus = new prism.opus.Encoder({rate: 48000, channels: 2, frameSize: 960});
    const transcoder = new prism.FFmpeg({
        args: [
            '-analyzeduration', '0',
            '-loglevel', '0',
            '-f', 's16le',
            '-ar', '48000',
            '-ac', '2',
        ],
    });
    const mp3Stream = fs.createReadStream(inputPath);
    mp3Stream.pipe(transcoder).pipe(opus)
    return opus
}

/**
 *
 * @param audioStream
 * @param {string} outputPath
 */
function writeStreamToWavFile(audioStream, outputPath) {
    const wavWriter = new wav.FileWriter(`${outputPath}`, {
        "channels": 2,
        "sampleRate": 48000,
        "bitDepth": 16
    })
    audioStream.pipe(wavWriter)
}

const spawn = require('child_process')
/**
 *
 * @param inputPath
 * @param outputPath
 * @param callback
 */
function convertWavFileToMp3File(inputPath, outputPath, callback) {
    spawn.execSync(`ffmpeg -i ${inputPath} -ac 2 -ar 48000 -vn -b:a 192k ${outputPath}`)
}

module.exports.createSilenceStream = createSilenceStream
module.exports.createStereoToMonoTransformStream = createStereoToMonoTransformStream
module.exports.writeStreamToMp3File = writeStreamToMp3File
module.exports.convertMp3FileToOpusStream = convertMp3FileToOpusStream
module.exports.writeStreamToWavFile = writeStreamToWavFile
module.exports.convertWavFileToMp3File = convertWavFileToMp3File