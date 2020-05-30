class GuildContext {
    constructor(configHandler, voiceConnection, textChannel) {
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
}

class MessageContext {
    constructor(user, message, textChannel) {
        /** @member {User} **/
        this.user = user
        /** @member {string} **/
        this.message = message
        /** @member {TextChannel} **/
        this.textChannel = textChannel
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
     * @param {TextChannel} textChannel
     */
    setTextChannel(textChannel) {
        this.textChannel = textChannel
    }

    /**
     *
     * @returns {TextChannel}
     */
    getTextChannel() {
        return this.textChannel
    }
}

class VoiceConnectionMessageContext extends MessageContext {
    constructor(messageContext, voiceConnection) {
        super(messageContext.user, messageContext.message, messageContext.textChannel);
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