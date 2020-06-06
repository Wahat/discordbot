const fileUtils = require('./file_utils.js')

class Keys {
    constructor() {
        this.keys = new Map()
        this.loadKeysFromJson()
    }

    /**
     *
     * @param {string} key
     * @returns {string}
     */
    get(key) {
        if (this.keys.has(key)) {
            return this.keys.get(key)
        } else {
            return process.env[key]
        }
    }

    loadKeysFromJson() {
        const json = fileUtils.openJsonFile('./keys.json')
        Object.keys(json).forEach(key => {
            this.keys.set(key, json[key])
        })
    }
}

module.exports.Key = new Keys()