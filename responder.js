class Responder {
    constructor() {
        this.contextMessagesMap = new Map()
    }

    /**
     *
     * @param {DiscordContext} context
     * @returns {Map}
     */
    getMessagesMap(context) {
        if (!this.contextMessagesMap.has(context.getGuildId())) {
            this.contextMessagesMap.set(context.getGuildId(), new Map())
        }
        return this.contextMessagesMap.get(context.getGuildId())
    }

    /**
     *
     * @param {DiscordContext} context
     * @param {MessageEmbed} embed
     * @param {string} type
     */
    respond(context, embed, type) {
        const textChannel = context.getTextChannel()
        if (textChannel === undefined) {
            return
        }
        textChannel.send(embed).then(msg => {
            this.getMessagesMap(context).set(type, msg)
        })
    }

    /**
     *
     * @param {DiscordContext} context
     * @param {string} type
     */
    remove(context, type) {
        const messagesMap = this.getMessagesMap(context)
        if (!messagesMap.has(type)) {
            return
        }
        messagesMap.get(type).delete()
        messagesMap.delete(type)
    }

    startTyping(context) {
        const textChannel = context.getTextChannel()
        if (textChannel === undefined) {
            return
        }
        textChannel.startTyping()
    }

    stopTyping(context) {
        const textChannel = context.getTextChannel()
        if (textChannel === undefined) {
            return
        }
        textChannel.stopTyping(true)
    }
}
module.exports.Responder = Responder