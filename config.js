const fs = require("fs");

class ConfigHandler {
    constructor() {

    }

    /**
     * @param {string} guildId
     * @returns Object
     */
    retrieveConfig(guildId) {
        return this.loadConfig(guildId)
    }

    loadConfig(guildId) {
        const path = `./configs/config_${guildId}.json`
        if (!fs.existsSync(path)) {
            fs.writeFileSync(path, this.buildDefaultConfig());
        }
        let rawdata = fs.readFileSync(path);
        return JSON.parse(rawdata)
    }

    saveConfig(guildId, guildConfig) {
        const path = `./configs/config_${guildId}.json`
        fs.writeFile(path, guildConfig, err => {
            console.log(`An error occured when saving guild ${guildId} config: ${err}`)
        })
    }

    updateConfig(guildId, guildConfig, category, key, value) {
        guildConfig[category][key] = value
        this.saveConfig(guildId, guildConfig)
        return guildConfig
    }

    buildDefaultConfig() {
        return JSON.stringify({
            "aliases": {},
            "nicknames": {},
            "prefix": "?",
        })
    }
}

module.exports.ConfigHandler = new ConfigHandler()