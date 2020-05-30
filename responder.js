class TextResponder {
    constructor() {
        /** @member {Map<string><Map<string><Message>>} **/
        this.contextMessagesMap = new Map()
    }

    /**
     *
     * @param {MessageContext} context
     * @returns {Map}
     */
    getMessagesMap(context) {
        const guildId = context.getTextChannel().guild.id
        if (!this.contextMessagesMap.has(guildId)) {
            this.contextMessagesMap.set(guildId, new Map())
        }
        return this.contextMessagesMap.get(guildId)
    }

    /**
     *
     * @param {MessageContext} context
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
     * @param {MessageContext} context
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

    /**
     *
     * @param {MessageContext} context
     */
    startTyping(context) {
        const textChannel = context.getTextChannel()
        if (textChannel === undefined) {
            return
        }
        textChannel.startTyping()
    }

    /**
     *
     * @param {MessageContext} context
     */
    stopTyping(context) {
        const textChannel = context.getTextChannel()
        if (textChannel === undefined) {
            return
        }
        textChannel.stopTyping(true)
    }
}
module.exports.TextResponder = TextResponder