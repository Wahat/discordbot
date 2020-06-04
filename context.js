const configHandler = require('./config.js').ConfigHandler

class GuildContext {
    constructor(voiceConnection, textChannel) {
        /** @member {VoiceConnection} **/
        this.voiceConnection = voiceConnection
        /** @member {TextChannel} **/
        this.textChannel = textChannel
        this.config = configHandler.retrieveConfig(this.getGuildId())
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
        return this.config
    }

    /**
     *
     * @returns {Guild}
     */
    getGuild() {
        return this.textChannel.guild ? this.textChannel.guild : this.voiceConnection.guild
    }

    /**
     *
     * @returns {Snowflake}
     */
    getGuildId() {
        return this.getGuild().id
    }
}

class MessageContext {
    constructor(user, message, textChannel, discordMessage=null) {
        /** @member {User} **/
        this.user = user
        /** @member {string} **/
        this.message = message
        /** @member {TextChannel} **/
        this.textChannel = textChannel
        /** @member {Message | null} **/
        this.discordMessage = discordMessage
    }

    /**
     *
     * @returns {Guild}
     */
    getGuild() {
        return this.textChannel.guild
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
     * @returns {TextChannel}
     */
    getTextChannel() {
        return this.textChannel
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

class VoiceConnectionMessageContext extends MessageContext {
    constructor(messageContext, voiceConnection) {
        super(messageContext.user, messageContext.message, messageContext.textChannel, messageContext.discordMessage);
        this.voiceConnection = voiceConnection
    }

    /**
     *
     * @returns {VoiceConnection}
     */
    getVoiceConnection() {
        return this.voiceConnection
    }
}

class GuildAudioContext {
    constructor() {
        this.audioStreams = new Map()
    }

    hasAudioStream(id) {
        return this.audioStreams.has(id)
    }

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
module.exports.VoiceConnectionMessageContext = VoiceConnectionMessageContext
module.exports.GuildAudioContext = GuildAudioContext