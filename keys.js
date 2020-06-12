const fileUtils = require('./file_utils.js')

class Keys {
    constructor() {
        /** @member {Map<string, string>} **/
        this.keys = new Map()
        this.loadKeysFromJson()
    }

    /**
     *
     * @param {string} key
     * @returns {string}
     */
    get(key) {
        return (this.keys.has(key)) ? this.keys.get(key) : process.env[key]
    }

    loadKeysFromJson() {
        const json = fileUtils.openJsonFile('./keys.json')
        Object.keys(json).forEach(key => {
            this.keys.set(key, json[key])
        })
    }
}

module.exports.Key = new Keys()