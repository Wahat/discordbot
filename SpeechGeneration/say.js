const say = require('say')
const audioUtils = require('../audio_utils.js')
const fileUtils = require('../file_utils.js')

const spawn = require('child_process')

/**
 * List of mac voices https://gist.github.com/mculp/4b95752e25c456d425c6
 * @param {string} message
 * @param {string} voice
 * @param callback
 */
function generateSpeechFromText(message, voice, callback) {
    const outputPath = './clips/speechToText.wav'
    const mp3Path = './clips/speechToText.mp3'
    say.export(message, voice, 1, outputPath, err => {
        if (err) {
            generateSpeechFromTextLinux(message, voice, outputPath)
        }
        audioUtils.convertWavFileToMp3File(outputPath, mp3Path)
        callback(audioUtils.convertMp3FileToOpusStream(mp3Path))
    })
    fileUtils.deleteFile(outputPath)
    fileUtils.deleteFile(mp3Path)
}

function generateSpeechFromTextLinux(message, voice, outputPath) {
    const command = `espeak -w ${outputPath} "${message}"`
    spawn.execSync(command)
}

module.exports.generateSpeechFromText = generateSpeechFromText