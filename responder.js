class TextResponder {
    constructor() {
        /** @member {Map<string><Map<string><Message>>} **/
        this.guildMessagesMap = new Map()
    }

    /**
     *
     * @param {MessageContext} context
     * @returns {Map<string><Message>}
     */
    getGuildMessages(context) {
        const guildId = context.getTextChannel().guild.id
        if (!this.guildMessagesMap.has(guildId)) {
            this.guildMessagesMap.set(guildId, new Map())
        }
        return this.guildMessagesMap.get(guildId)
    }

    /**
     *
     * @param {MessageContext} context
     * @param {MessageEmbed} embed
     * @param {string} type
     * @param callback
     */
    respond(context, embed, type, callback=()=>{}) {
        const textChannel = context.getTextChannel()
        if (textChannel === undefined) {
            return
        }
        textChannel.send(embed).then(msg => {
            this.getGuildMessages(context).set(type, msg)
            callback()
        })
    }

    /**
     *
     * @param {MessageContext} context
     * @param {string} type
     */
    remove(context, type) {
        const messagesMap = this.getGuildMessages(context)
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
module.exports.TextResponder = new TextResponder()