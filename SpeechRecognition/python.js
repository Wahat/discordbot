const spawn = require("child_process").spawn
const audioUtils = require('../audio_utils.js')

const required_config_vars = []

/**
 * Callback for receiving results from voice recognition
 *
 * @callback onVoiceParsedCallback
 * @param {string} data
 */

/**
 *
 * @param {ReadableStream} audioStream
 * @param {onVoiceParsedCallback} callback
 */
function runSpeechRecognition(audioStream, callback) {
    const stamp = Date.now().toString()
    const outputFile = `./clips/${stamp}.wav`
    audioUtils.writeStreamToWavFile(audioStream, outputFile)
    audioStream.on('end', () => {
        console.time('pythonRecognition')
        const pythonProcess = spawn('python', ["./SpeechRecognition/PythonSpeechRecognition/main.py", outputFile]);
        pythonProcess.stdout.on('data', data => {
            callback(data)
        });
        console.timeEnd('pythonRecognition')
    })
}

module.exports.runSpeechRecognition = runSpeechRecognition