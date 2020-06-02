const events = require('events')
const ctx = require('./context.js')
const embedder = require('./embedder').Embedder

const commandConfig = require(`./commands_config.json`)

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
        /** @member {TextResponder} **/
        this.textResponder = require('./responder.js').TextResponder
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
        let commandType = parseCommand(yargs['_'].shift())
        if (commandConfig["commands"][commandType]) {
            const commandArgs = commandConfig["commands"][commandType]["args"]
            const parsedArgs = {}
            if (yargs['h']) {
                this.textResponder.showCommandHelp(msgContext, commandConfig, commandType)
                return
            }
            commandArgs.forEach(commandArg => {
                parsedArgs[commandArg["name"]] = commandArg["flag"] === "_" && yargs[commandArg["flag"]]
                    ? yargs[commandArg["flag"]].join(' ') : yargs[commandArg["flag"]]
                if (commandArg["required"] && !parsedArgs[commandArg["name"]]) {
                    this.textResponder.respond(msgContext,
                        embedder.createErrorEmbed(
                            `${commandType} requires ${commandArg["name"]} parameter (${commandArg["flag"]})`)
                        , "error")
                    return
                }
                if (commandArg["integer"] && !isNumeric(parsedArgs[commandArg["name"]])) {
                    embedder.createErrorEmbed(
                        `${commandArg["name"]} parameter must be integer`, "error")
                } else if (commandArg["integer"]) {
                    parsedArgs[commandArg["name"]] = parseInt(parsedArgs[commandArg["name"]])
                }
            })
            const commandExec = commandConfig["commands"][commandType]["command"]
            const execArgs = []
            commandExec["args"].forEach(arg => {
                let parsedArg = parsedArgs[arg]
                if (parsedArg == null && !commandArgs.find(commandArg => commandArg["name"] === arg)) {
                    parsedArg = arg
                }
                execArgs.push(parsedArg)
            })
            let commandContext = new ctx.VoiceConnectionMessageContext(msgContext, context.getVoiceConnection())
            this[commandExec["handler"]][commandExec["name"]](commandContext, ...execArgs)
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