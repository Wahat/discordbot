const embedder = require('./embedder.js').Embedder
const speechGenerator = require('./SpeechGeneration/SpeechGeneration.js').SpeechGeneration

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
     */
    showBasicHelp(context) {
        this.respond(context, embedder.getBaseEmbed().setDescription('help'), 'help')
    }

    showMemoryUsage(context) {
        this.respond(context, embedder.getBaseEmbed().setDescription(
            `Memory heapTotal: ${process.memoryUsage().heapTotal / 1000000}\nMemory heapUsed: ${process.memoryUsage().heapUsed / 1000000}\nMemory external: ${process.memoryUsage().external / 1000000}\nMemory rss: ${process.memoryUsage().rss / 1000000}`)
        )
    }

    /**
     *
     * @param {MessageContext} context
     * @param {Object} commandConfig
     * @param {string} commandType
     */
    showCommandHelp(context, commandConfig, commandType)  {
        this.respond(context,
            embedder.createCommandHelpEmbed(commandConfig["commands"][commandType]),
            `${commandType}_help`, () => {
                setTimeout(() => {
                    this.remove(context, `${commandType}_help`)
                }, 10000)
            })
    }

    /**
     *
     * @param {MessageContext} context
     * @param {MessageEmbed} embed
     * @param {string} type
     * @param callback
     * @return boolean
     */
    respond(context, embed, type='', callback=()=>{}) {
        const textChannel = context.getTextChannel()
        if (!textChannel) {
            return false
        }
        textChannel.send(embed).then(msg => {
            if (type) {
                this.getGuildMessages(context).set(type, msg)
            }
            callback(msg)
        })
        return true
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
     * @param {string | EmojiIdentifierResolvable} emoji
     * @return boolean
     */
    react(context, emoji) {
        if (!context.getDiscordMessage()) {
            return false
        }
        // if (emoji.length !== 1) {
        //     emoji = context.getDiscordMessage().guild.emojis.cache.get(emoji)
        // }
        context.getDiscordMessage().react(emoji)
        return true
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

class VoiceResponder {
    constructor() {

    }

    /**
     *
     * @param {DJHandler} dj
     * @param {MessageContext} context
     * @param message
     * @param voice
     * @return Promise<>
     */
    respond(dj, context, message, voice) {
        return new Promise((res, rej) => {
            speechGenerator.generateSpeechFromText(message, voice, stream => {
                dj.playAudioEvent(context, stream, 'opus', () => {
                    res()
                })
            })
        })
    }
}


module.exports.TextResponder = new TextResponder()
module.exports.VoiceResponder = new VoiceResponder()