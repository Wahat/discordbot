const spawn = require("child_process").spawn;
/**
 * Callback for receiving results from voice recognition
 *
 * @callback onVoiceParsedCallback
 * @param {string} data
 */

/**
 *
 * @param {string} file
 * @param {onVoiceParsedCallback} callback
 */
function runSpeechRecognition(file, callback) {
    const pythonProcess = spawn('python', ["./SpeechRecognition/main.py", file]);
    pythonProcess.stdout.on('data', data => {
        callback(data)
    });
}

module.exports.runSpeechRecognition = runSpeechRecognition