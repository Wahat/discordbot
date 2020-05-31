const spawn = require("child_process").spawn
const audioUtils = require('../audio_utils.js')

/**
 * Callback for receiving results from voice recognition
 *
 * @callback onVoiceParsedCallback
 * @param {string} data
 */

/**
 *
 * @param {ReadableStream} audioStream
 * @param {string} userTag
 * @param {onVoiceParsedCallback} callback
 */
function runSpeechRecognition(audioStream, userTag, callback) {
    const outputFile = `./clips/${userTag}.wav`
    audioUtils.writeStreamToWavFile(audioStream, outputFile)
    audioStream.on('end', () => {
        const start = Date.now()
        const pythonProcess = spawn('python', ["./SpeechRecognition/PythonSpeechRecognition/main.py", outputFile]);
        pythonProcess.stdout.on('data', data => {
            callback(data)
        });
        console.log(`Finished recording: ${Date.now() - start} seconds`)
    })
}

module.exports.runSpeechRecognition = runSpeechRecognition