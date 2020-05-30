const events = require('events')
const ctx = require('./context.js')

class CommandHandler {
    /**
     *
     * @param {DJ} dj
     * @param {AudioHandler} audioHandler
     */
    constructor(dj, audioHandler) {
        /** @member {DJ} **/
        this.dj = dj

        /** @member {AudioHandler} **/
        this.audioHandler = audioHandler
        this.eventReceiver = new events.EventEmitter()

        this.eventReceiver.on('playAudioAck', (context, mode) => {
            this.dj.playAudioAck(context, mode)
        })

        this.eventReceiver.on('command', (context, msgContext) => {
            this.onCommandReceived(context, msgContext)
        })

        this.eventReceiver.on('playAudioWavStream', (context, stream) => {
            this.dj.playAudioWavStream(context, stream)
        })

        this.eventReceiver.on('error', (context, msg) => {

        })
    }

    /**
     *
     * @param {GuildContext} context
     * @param {MessageContext} msgContext
     */
    onCommandReceived(context,  msgContext) {
        const input = msgContext.getMessage()
        const command = this.parseCommand(input)
        if (command === '') {
            console.log(`Invalid Command: ${input}`)
            return
        }
        const args = command.split(' ')
        const commandType = args[0]
        args.shift()
        const commandParams = args

        if (!msgContext.getTextChannel()) {
            msgContext.setTextChannel(context.getTextChannel())
        }

        let commandContext = new ctx.VoiceConnectionMessageContext(msgContext, context.getVoiceConnection())
        // VoiceConnectionRelatedCommands
        switch(commandType) {
            case "play":
                const args = this.parseStringArgs(commandParams)
                if (args === "") {
                    return
                }
                this.dj.play(commandContext, args)
                break
            case 'skip':
                this.dj.skip(commandContext)
                break
            case 'stop':
                this.dj.stop(commandContext)
                break
            case 'pause':
                this.dj.pause(commandContext)
                break
            case 'resume':
                this.dj.resume(commandContext)
                break
            case 'volume':
                const volume = this.parseSingleInteger(commandParams)
                if (volume === -1) {
                    return
                }
                this.dj.volume(commandContext, volume)
                break
            case 'queue':
                this.dj.queue(commandContext)
                break
            case 'song':
                const index = this.parseSingleInteger(commandParams, 0)
                this.dj.song(commandContext, index)
                break
            case 'lower':
                this.dj.volume(commandContext, 50, true)
                break
            case 'higher':
                this.dj.volume(commandContext, 200, true)
                break
            case 'record':
                const recordUserName = this.parseStringArgs(commandParams)
                const recordUser = context.getUserFromName(recordUserName)
                if (!recordUser) {
                    return
                }
                this.audioHandler.recordUserToFile(commandContext, recordUser.user, `${recordUser.displayName} said`, 0)
                break
            case 'replay':
                const replayUserName = this.parseStringArgs(commandParams)
                const replayUser = context.getUserFromName(replayUserName)
                if (!replayUser) {
                    return
                }
                this.audioHandler.replayUser(commandContext, replayUser.user, 0)
                break
        }
    }

    /**
     *
     * @param {GuildContext} context
     * @param {MessageContext} msgContext
     */
    determineReplyChannel(context, msgContext) {
        return msgContext.getTextChannel() ? msgContext.getTextChannel() : context.getTextChannel()
    }

    /**
     * @param {string} input
     * @returns {string}
     */
    parseCommand(input) {
        input = input.trim()
        return input
    }

    /**
     *
     * @param {string[]} args
     * @param defaultVal
     * @return {int}
     */
    parseSingleInteger(args, defaultVal=-1) {
        if (args.length !== 1 || !isNumeric(args[0])) {
            return defaultVal
        }
        return parseInt(args[0])
    }

    /**
     *
     * @param {string[]} args
     * @returns {string}
     */
    parseStringArgs(args) {
        if (args.length < 1) {
            return ""
        }
        return args.join(' ')
    }
}

/**
 *
 * @param {string} value
 * @returns {boolean}
 */
function isNumeric(value) {
    return /^\d+$/.test(value);
}

module.exports.CommandHandler = CommandHandler