const spawn = require("child_process").spawn
const wav = require('wav')

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
    writeStreamToWavFile(audioStream, outputFile)
    audioStream.on('end', () => {
        const start = Date.now()
        const pythonProcess = spawn('python', ["./SpeechRecognition/main.py", outputFile]);
        pythonProcess.stdout.on('data', data => {
            callback(data)
        });
        console.log(`Finished recording: ${Date.now() - start} seconds`)
    })
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

module.exports.runSpeechRecognition = runSpeechRecognition