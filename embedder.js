const Discord = require('discord.js')

function getBaseEmbed() {
    return new Discord.MessageEmbed()
        .setColor([46, 115, 189])
}

function createNowPlayingEmbed(song) {
    return getBaseEmbed()
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
function createQueueEmbed(queue, song) {
    if (queue.length === 0) {
        return createErrorEmbed('Queue is empty')
    }
    let queueString = ""
    queue.forEach(song => {
        queueString += `${song.title}\t\t${song.length}s\n`
    })
    const newlyQueued = song == null ? "" : `<@${song.requesterId}> queued: [${song.title}](${song.url})`
    return getBaseEmbed()
        .setTitle('Queued')
        .setDescription(`${newlyQueued}\n\`\`\`\n${queueString}\`\`\``)
}

/**
 *
 * @param {Array} queue
 * @param {int} index
 */
function createSongDetailsEmbed( queue, index) {
    if (index < 0 || !queue[index]) {
        return createErrorEmbed('Invalid index provided')
    }
    const song = queue[index]
    const title = index === 0 ? 'Current Song' : `Song ${index}`
    return getBaseEmbed()
        .setTitle(title)
        .setDescription(`[${song.title}](${song.url}) queued [<@${song.requesterId}>]`)
}

function createRecordingFileEmbed(filePath, caption, userId) {
    const messageAttachment = new Discord.MessageAttachment(filePath, `${caption}.mp3`)
    return getBaseEmbed()
        .setDescription(`Recording from [<@${userId}>]`)
        .attachFiles(messageAttachment)
}

/**
 *
 * @param {string} message
 */
function createErrorEmbed(message) {
    return getBaseEmbed()
        .setDescription(`\`\`\`${message}\`\`\``)
}

module.exports.createNowPlayingEmbed = createNowPlayingEmbed
module.exports.createQueueEmbed = createQueueEmbed
module.exports.createErrorEmbed = createErrorEmbed
module.exports.createSongDetailsEmbed = createSongDetailsEmbed
module.exports.createRecordingFileEmbed = createRecordingFileEmbed