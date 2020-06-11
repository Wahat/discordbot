const configHandler = require('./config.js').ConfigHandler

class GuildContext {
    constructor(voiceConnection, textChannel) {
        /** @member {VoiceConnection} **/
        this.voiceConnection = voiceConnection
        /** @member {TextChannel} **/
        this.textChannel = textChannel
    }

    /**
     *
     * @returns {VoiceConnection}
     */
    getVoiceConnection() {
        return this.voiceConnection
    }

    /**
     *
     * @returns {TextChannel}
     */
    getTextChannel() {
        return this.textChannel
    }

    /**
     *
     * @returns {any}
     */
    getConfig() {
        return configHandler.retrieveConfig(this.getGuild().id)
    }

    /**
     *
     * @returns {Guild}
     */
    getGuild() {
        return this.textChannel.guild ? this.textChannel.guild : this.voiceConnection.guild
    }
}

class MessageContext extends GuildContext {
    constructor(user, message, textChannel, discordMessage = null, voiceConnection = null) {
        super(voiceConnection, textChannel)
        /** @member {User} **/
        this.user = user
        /** @member {string} **/
        this.message = message
        /** @member {Message | null} **/
        this.discordMessage = discordMessage
    }

    hasVoiceConnection() {
        return this.voiceConnection != null
    }

    /**
     *
     * @returns {User}
     */
    getUser() {
        return this.user
    }

    /**
     *
     * @returns {string}
     */
    getMessage() {
        return this.message
    }

    /**
     *
     * @returns {Message}
     */
    getDiscordMessage() {
        return this.discordMessage
    }

    /**
     *
     * @param {string} name
     * @returns {GuildMember}
     */
    getUserFromName(name) {
        const user = this.getGuild().members.cache.find(user => user.displayName === name)
        if (user) {
            console.log(`Found user ${user.displayName}`)
        }
        return user
    }

    /**
     *
     * @param {string} id
     * @returns {GuildMember}
     */
    getUserFromId(id) {
        const user = this.getGuild().members.cache.find(user => user.id === id)
        if (user) {
            console.log(`Found user ${user.displayName} using (${user.id})`)
        }
        return user
    }
}

class GuildAudioContext {
    constructor() {
        /** @member {Map<String, Recorder>} **/
        this.audioStreams = new Map()
    }

    /**
     *
     * @param {string} id
     * @returns {boolean}
     */
    hasAudioStream(id) {
        return this.audioStreams.has(id)
    }

    /**
     *
     * @param {string} id
     * @param {Recorder} audioStream
     */
    setAudioStream(id, audioStream) {
        this.audioStreams.set(id, audioStream)
    }

    /**
     *
     * @param {string} id
     * @returns {Recorder}
     */
    getAudioStream(id) {
        return this.audioStreams.get(id)
    }

    removeAudioStream(id) {
        this.audioStreams.delete(id)
    }

    clearAudioStreams() {
        this.audioStreams.clear()
    }
}

module.exports.GuildContext = GuildContext
module.exports.MessageContext = MessageContext
module.exports.GuildAudioContext = GuildAudioContext