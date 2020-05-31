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

const say = require('say')
const audioUtils = require('./audio_utils.js')
const fileUtils = require('./file_utils.js')
class VoiceResponder {
    constructor() {

    }

    /**
     * List of mac voices https://gist.github.com/mculp/4b95752e25c456d425c6
     * @param {DJ} dj
     * @param {VoiceConnectionMessageContext} context
     * @param message
     * @param voice
     * @param callback
     */
    respond(dj, context, message, voice='Samantha', callback=()=>{}) {
        const outputPath = './clips/speechToText.wav'
        const mp3Path = './clips/speechToText.mp3'
        say.export(message, voice, 1, outputPath, err => {
            if (err) {
                return console.error(err)
            }
            audioUtils.convertWavFileToMp3File(outputPath, mp3Path)
            dj.playAudioEvent(context, audioUtils.convertMp3FileToOpusStream(mp3Path), 'opus', ()=>{
                fileUtils.deleteFile(outputPath)
                fileUtils.deleteFile(mp3Path)
            })
            callback()
        })
    }
}


module.exports.TextResponder = new TextResponder()
module.exports.VoiceResponder = new VoiceResponder()