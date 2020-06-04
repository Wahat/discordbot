const commands = require('./dm_config.json')

class DMHandler {
    constructor() {
        /** @member {Map<string, Object>} **/
        this.messageStack = new Map()
    }

    /**
     *
     * @param {module:"discord.js".Client} client
     * @param {Message} msg
     */
    onMessageReceived(client, msg) {
        if (msg.author.bot) {
            return
        }
        if (!this.messageStack.has(msg.author.id)) {
            if (!checkIfUserIsInAServerAndIsAdmin(client, msg.author)) {
                msg.reply("You are not an administrator of any server I am apart of!")
                return
            }
            this.startNewCommandProcess(client, msg)
        }
        this.resumeCommandProcess(client, msg)
    }

    /**
     *
     * @param {module:"discord.js".Client} client
     * @param {Message} msg
     */
    startNewCommandProcess(client, msg) {
        const yargs = require('yargs-parser')(msg.content)
        let commandType = (yargs['_'].shift().trim())
        if (!commands["commands"][commandType]) {
            console.log("Invalid command")
            return
        }
        let command = commands["commands"][commandType]
        this.messageStack.set(client.user.id, {
            "upcoming": command["stack"],
            "completed": [],
            "variables": {}
        })
        this.resumeCommandProcess(client, msg)
    }

    /**
     *
     * @param {module:"discord.js".Client} client
     * @param {Message} msg
     */
    resumeCommandProcess(client, msg) {
        let command = this.messageStack.get(client.user.id).upcoming.shift()
        let arg = msg.content
        switch(command["type"]) {
            case "request":
                break
            case "response":
                break
        }
    }
}

function preParseCommands(client, msg, arg) {
    switch(arg) {
        case "guilds":
            return getUserGuilds(client, msg.author)
        case "members":
            return getGuildMembers(client, msg.author, msg.content)
        case "guild":
            return getGuildFromName(client, msg.author, msg.content)
    }
}

/**
 *
 * @param {module:"discord.js".Client} client
 * @param {User} user
 * @return {Collection<Guild> | Array<Guild>}
 */
function getUserGuilds(client, user) {
    const userGuilds = []
    client.guilds.cache.filter(guild => guild.members.cache.find(it => it.id === user.id) !== undefined)
        .forEach(guild => {
            const guildMember = guild.members.cache.find(it => it.id === user.id)
            if (guildMember.hasPermission("ADMINISTRATOR")) {
                userGuilds.push(guild)
            }
        })
    return userGuilds
}

function getGuildFromName(client, user, guildName) {
    return getUserGuilds(client, user).find(it => it.name === guildName)
}

/**
 *
 * @param client
 * @param {User} user
 * @param {string} guildName
 * @return {Collection<GuildMember> | Array<GuildMember>}
 */
function getGuildMembers(client, user, guildName) {
    const guild = getGuildFromName(client, user, guildName)
    if (!guild) {
        return []
    }
    return guild.members.cache.values()
}

/**
 *
 * @param {module:"discord.js".Client} client
 * @param {User} user
 * @return {Boolean}
 */
function checkIfUserIsInAServerAndIsAdmin(client, user) {
    return getUserGuilds(client, user).length !== 0
}

module.exports.DMHandler = new DMHandler()