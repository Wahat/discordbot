const fs = require('fs')


function openJsonFile(filePath) {
    if (!fs.existsSync(filePath)) {
        return {}
    }
    let rawdata = fs.readFileSync(filePath);
    return JSON.parse(rawdata)
}
/**
 *
 * @param {string} filePath
 * @param {boolean} sync
 * @param callback
 */
function deleteFile(filePath, sync=true, callback=()=>{}) {
    if (sync) {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
        }
    } else {
        if (fs.existsSync(filePath)) {
            fs.unlink(filePath, callback)
        }
    }
}

module.exports.deleteFile = deleteFile
module.exports.openJsonFile = openJsonFile