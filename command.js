const events = require('events')
const ctx = require('./context.js')
const embedder = require('./embedder').Embedder
const guildHandler = require('./guild.js').GuildHandler

const commandConfig = require(`./commands_config.json`)

class CommandHandler {
    /**
     *
     * @param {DJHandler} dj
     * @param {AudioHandler} audioHandler
     */
    constructor(dj, audioHandler) {
        /** @member {DJHandler} **/
        this.dj = dj
        /** @member {AudioHandler} **/
        this.audioHandler = audioHandler
        /** @member {TextResponder} **/
        this.textResponder = require('./responder.js').TextResponder
        /** @member {EventEmitter | module:events.internal.EventEmitter} **/
        this.eventReceiver = new events.EventEmitter()

        this.eventReceiver.on('playAudioAck', (context, mode, callback) => {
            this.dj.playAudioAck(context, mode, callback)
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
        let commandType = parseCommand(yargs['_'].shift().toLowerCase())
        if (commandConfig["commands"][commandType]) {
            /** @type {Collection} **/
            const commandArgs = commandConfig["commands"][commandType]["args"]
            const parsedArgs = {}
            if (yargs['h']) {
                this.textResponder.showCommandHelp(msgContext, commandConfig, commandType)
                return
            }
            let failedArg = false
            commandArgs.forEach(commandArg => {
                parsedArgs[commandArg["name"]] = commandArg["flag"] === "_" && yargs[commandArg["flag"]]
                    ? yargs[commandArg["flag"]].join(' ') : yargs[commandArg["flag"]]
                if (commandArg["required"] && !parsedArgs[commandArg["name"]]) {
                    this.textResponder.respond(msgContext,
                        embedder.createBasicMessageEmbed(`${commandType} requires ${commandArg["name"]} parameter (${commandArg["flag"]})`))
                    failedArg = true
                    return
                }
                if (commandArg["integer"] && !isNumeric(parsedArgs[commandArg["name"]])) {
                    this.textResponder.respond(msgContext,
                        embedder.createBasicMessageEmbed(`${commandArg["name"]} parameter must be integer`),
                        'error')
                    failedArg = true
                } else if (commandArg["integer"]) {
                    parsedArgs[commandArg["name"]] = parseInt(parsedArgs[commandArg["name"]])
                }
            })
            if (failedArg) {
                return
            }
            const commandExec = commandConfig["commands"][commandType]["command"]
            const execArgs = []
            let invalidArg = false
            commandExec["args"].forEach(arg => {
                let parsedArg = parsedArgs[arg]
                if (parsedArg == null && !commandArgs.find(commandArg => commandArg["name"] === arg)) {
                    parsedArg = arg
                }
                try {
                    parsedArg = preParseSpecificArgumentsIfNeeded(this.textResponder, msgContext, arg, parsedArg)
                } catch {
                    invalidArg = true
                }
                execArgs.push(parsedArg)
            })
            if (invalidArg) {
                return
            }
            let commandContext = new ctx.VoiceConnectionMessageContext(msgContext, context.getVoiceConnection())
            this[commandExec["handler"]][commandExec["name"]](commandContext, ...execArgs)
        }
    }
}

/**
 *
 * @param {TextResponder} textResponder
 * @param {MessageContext} msgContext
 * @param {string} arg
 * @param {string | GuildMember} parsedArg
 * @returns {GuildMember | int}
 */
function preParseSpecificArgumentsIfNeeded(textResponder, msgContext, arg, parsedArg) {
    switch (arg) {
        case "user" :
            parsedArg = parseUser(msgContext, parsedArg)
            if (!parsedArg) {
                textResponder.respond(msgContext,
                    embedder.createBasicMessageEmbed(`Invalid user provided (Display name / Nickname / Mention)`))
                throw('Invalid user provided')
            }
    }
    return parsedArg
}

/**
 * If command argument is labelled "user", this command is called by default
 * @param {MessageContext} context
 * @param {string} input
 */
function parseUser(context, input) {
    const guildConfig = guildHandler.getGuildContextFromId(context.getGuild().id)
    let user = context.getUserFromName(input)
    if (!user) {
        user = context.getUserFromId(parseMention(input))
        if (!user) {
            input = guildConfig.getConfig()["nicknames"][input]
            user = context.getUserFromId(input)
        }
    }
    return user
}

/**
 * Mentions are passed as <@!1111111111111>
 * @param {string} input
 * @return {string | null}
 */
function parseMention(input) {
    const parsedId = input.match(/^<@!?(\d+)>$/)
    if (parsedId != null) {
        return parsedId[1]
    }
    return null
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