const events = require('events')
const ctx = require('./context.js')
const textResponder = require('./responder.js').TextResponder
const embedder = require('./embedder').Embedder

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
        /** @member {EventEmitter | module:events.EventEmitter.EventEmitter} **/
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
    onCommandReceived(context, msgContext) {
        const yargs = require('yargs-parser')(msgContext.getMessage())
        const commandType = parseCommand(yargs['_'].shift())
        if (context.getConfig().commands[commandType]) {
            const commandArgs = context.getConfig()["commands"][commandType]["args"]
            const parsedArgs = {}
            if (yargs['h']) {
                textResponder.respond(msgContext,
                    embedder.createCommandHelpEmbed(context.getConfig()["commands"][commandType]),
                    `${commandType}_help`, () => {
                        setTimeout(() => {
                            textResponder.remove(msgContext, `${commandType}_help`)
                        }, 10000)
                    })
                return
            }
            commandArgs.forEach(commandArg => {
                parsedArgs[commandArg["name"]] = commandArg["flag"] === "_" && yargs[commandArg["flag"]]
                    ? yargs[commandArg["flag"]].join(' ') : yargs[commandArg["flag"]]
                if (commandArg["required"] && !parsedArgs[commandArg["name"]]) {
                    textResponder.respond(msgContext,
                        embedder.createErrorEmbed(
                            `${commandType} requires ${commandArg["name"]} parameter (${commandArg["flag"]})`)
                        , "error")
                }
                if (commandArg["integer"] && !isNumeric(parsedArgs[commandArg["name"]])) {
                    embedder.createErrorEmbed(
                        `${commandArg["name"]} parameter must be integer`, "error")
                } else if (commandArg["integer"]) {
                    parsedArgs[commandArg["name"]] = parseInt(parsedArgs[commandArg["name"]])
                }
            })
            const commandExec = context.getConfig()["commands"][commandType]["command"]
            const execArgs = []
            commandExec['args'].forEach(arg => {
                let parsedArg = parsedArgs[arg]
                if (parsedArg == null && !commandArgs.find(commandArg => commandArg["name"] === arg)) {
                    parsedArg = arg
                }
                execArgs.push(parsedArg)
            })
            let commandContext = new ctx.VoiceConnectionMessageContext(msgContext, context.getVoiceConnection())
            this[commandExec['handler']][commandExec['name']](commandContext, ...execArgs)
        }
    }
}

/**
 * @param {string} input
 * @returns {string}
 */
function parseCommand(input) {
    input = input.trim()
    return input
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