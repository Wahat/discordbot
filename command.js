const DJ = require('./dj.js')
const Events = require('events')

class CommandHandler {
    constructor() {
        this.DJ = new DJ.DJ()
        this.eventBus = new Events.EventEmitter()

        this.eventBus.on('playAudioAck', (connection, mode) => {
            this.DJ.playAudioAck(connection, mode)
        })

        this.eventBus.on('command', (context, msgContext) => {
            this.onCommandReceived(context, msgContext)
        })
    }

    /**
     *
     * @param {DiscordContext} context
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
        switch(commandType) {
            case "play":
                const args = this.parsePlay(commandParams)
                if (args === "") {
                    return
                }
                this.DJ.play(context, msgContext, args)
                break
            case 'skip':
                this.DJ.skip(context)
                break
            case 'stop':
                this.DJ.stop(context)
                break
            case 'pause':
                this.DJ.pause(context)
                break
            case 'resume':
                this.DJ.resume(context)
                break
            case 'volume':
                const volume = this.parseSingleInteger(commandParams)
                if (volume === -1) {
                    return
                }
                this.DJ.volume(context, volume)
                break
            case 'queue':
                this.DJ.queue(context)
                break
            case 'song':
                const index = this.parseSingleInteger(commandParams, 0)
                this.DJ.song(context, index)
                break
        }
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
    parsePlay(args) {
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