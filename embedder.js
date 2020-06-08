const Discord = require('discord.js')

class Embedder {
    /**
     *
     * @returns {module:"discord.js".MessageEmbed}
     */
    getBaseEmbed() {
        return new Discord.MessageEmbed()
            .setColor([46, 115, 189])
    }

    /**
     *
     * @param song
     * @returns {MessageEmbed}
     */
    createNowPlayingEmbed(song) {
        return this.getBaseEmbed()
            .setTitle("Now Playing")
            .setDescription(`[${song.title}](${song.url}) [<@${song.requesterId}>]`)
            .setThumbnail(song.thumbnail_url)
    }

    /**
     *
     * @param {Object} song
     * @param {Array} queue
     * @return {MessageEmbed}
     */
    createQueueEmbed(queue, song) {
        if (queue.length === 0) {
            return this.createBasicMessageEmbed('Queue is empty')
        }
        let queueString = ""
        queue.forEach(song => {
            queueString += `${song.title}\t\t${song.length}s\n`
        })
        const newlyQueued = song == null ? "" : `<@${song.requesterId}> queued: [${song.title}](${song.url})`
        return this.getBaseEmbed()
            .setTitle('Queued')
            .setDescription(`${newlyQueued}\n\`\`\`\n${queueString}\`\`\``)
    }

    /**
     *
     * @param {Array} queue
     * @param {int} index
     */
    createSongDetailsEmbed(queue, index) {
        if (index < 0 || !queue[index]) {
            return this.createBasicMessageEmbed('Invalid index provided')
        }
        const song = queue[index]
        const title = index === 0 ? 'Current Song' : `Song ${index}`
        return this.getBaseEmbed()
            .setTitle(title)
            .setDescription(`[${song.title}](${song.url}) queued [<@${song.requesterId}>]`)
    }

    /**
     *
     * @param {string} filePath
     * @param {string} caption
     * @param {string} userId
     * @returns {MessageEmbed}
     */
    createRecordingFileEmbed(filePath, caption, userId) {
        const messageAttachment = new Discord.MessageAttachment(filePath, `${caption}.mp3`)
        return this.getBaseEmbed()
            .setDescription(`Recording from [<@${userId}>]`)
            .attachFiles(messageAttachment)
    }

    /**
     *
     * @param {object} command
     * @returns {MessageEmbed}
     */
    createCommandHelpEmbed(command) {
        const fields = []
        command["args"].forEach(arg => {
            let flag = arg["flag"] === '_' ? '' : `-${arg["flag"]}:`
            fields.push({
                name: arg["name"],
                value: `${flag}${arg["description"]}`
            })
        })
        return this.getBaseEmbed()
            .setDescription(command["description"])
            .addFields(fields)
    }

    /**
     *
     * @param {string} message
     */
    createBasicMessageEmbed(message) {
        return this.getBaseEmbed()
            .setDescription(`\`\`\`${message}\`\`\``)
    }
}

module.exports.Embedder = new Embedder()