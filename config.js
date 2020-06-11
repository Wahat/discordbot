const fs = require('fs');
const fileUtils = require('./file_utils.js')

class ConfigHandler {
    constructor() {
        this.configs = new Map()
    }

    /**
     * @param {string} guildId
     * @returns Object
     */
    retrieveConfig(guildId) {
        if (!this.configs.has(guildId)) {
            this.configs.set(guildId, this.loadConfig(guildId))
        }
        return this.configs.get(guildId)
    }

    loadConfig(guildId) {
        const path = `./configs/config_${guildId}.json`
        if (!fs.existsSync(path)) {
            fs.copyFileSync('./default_config.json', path, err => {
                if (err) {
                    console.log(`An error occured when copying default config`)
                }
            })
        }
        return fileUtils.openJsonFile(path)
    }

    saveConfig(guildId, guildConfig) {
        const path = `./configs/config_${guildId}.json`
        fs.writeFile(path, JSON.stringify(guildConfig, null, '\t'), err => {
            if (err) {
                console.log(`An error occured when saving guild ${guildId} config: ${err}`)
            }
        })
    }
    /**
     *
     * @param {Guild} guild
     * @param {string} type
     * @param {string} key
     * @param {string} value
     */
    setNewConfigParameter(guild, type, key, value) {
        console.log(`config: ${guild.id}, ${type} ${key} ${value}`)
        let config = this.retrieveConfig(guild.id)
        config[type][key] = value
        this.saveConfig(guild.id, config)
        this.configs.set(guild.id, config)
    }
}

module.exports.ConfigHandler = new ConfigHandler()