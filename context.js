class DiscordContext {
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
     * @returns {Snowflake}
     */
    getGuildId() {
        return this.textChannel.guild.id
    }
}

class MessageContext {
    constructor(user, message) {
        /** @member {User} **/
        this.user = user
        /** @member {string} **/
        this.message = message
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
}

module.exports.DiscordContext = DiscordContext
module.exports.MessageContext = MessageContext