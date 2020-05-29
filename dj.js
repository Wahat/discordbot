const fs = require('fs')
const ytdl = require('ytdl-core-discord')
const search = require('./search.js')
const prism = require('prism-media')
const responder = require('./responder.js')
const embedder = require('./embedder.js')

class DJ {
    siri_ack_start = '/Users/henryxu/Documents/WebstormProjects/discordbot/resources/siri_acknowledge.mp3'
    siri_ack_finish = '/Users/henryxu/Documents/WebstormProjects/discordbot/resources/siri_acknowledge_done.mp3'

    constructor() {
        this.guildQueues = new Map()
        this.responder = new responder.Responder()
    }

    getGuildQueue(context) {
        if(!this.guildQueues.has(context.getGuildId())) {
            const queueObject = {
                voiceChannel: context.getVoiceConnection().channel,
                connection: context.getVoiceConnection(),
                songs: [],
                volume: 0.25,
                isPlaying: true,
            };
            this.guildQueues.set(context.getGuildId(), queueObject)
        }
        return this.guildQueues.get(context.getGuildId())
    }

    /**
     *
     * @param {DiscordContext} context
     * @param {int} volume
     */
    volume(context, volume) {
        const queue = this.getGuildQueue(context)
        queue.connection.dispatcher.setVolume(volume / 100);
    }

    /**
     *
     * @param {DiscordContext} context
     */
    queue(context) {
        const queue = this.getGuildQueue(context)
        this.responder.respond(context, embedder.createQueueEmbed(queue.songs, null), 'queue')
    }

    /**
     *
     * @param {DiscordContext} context
     * @param index
     */
    song(context, index) {
        const queue = this.guildQueues.get(context.getGuildId())
        this.responder.respond(context, embedder.createSongDetailsEmbed(queue.songs, index), 'current')
    }

    /**
     *
     * @param {DiscordContext} context
     */
    skip(context) {
        const queue = this.getGuildQueue(context)
        this.playNext(context, queue)
    }

    /**
     *
     * @param {DiscordContext} context
     */
    stop(context) {
        // if (!message.member.voice.channel)
        //     return message.channel.send(
        //         "You have to be in a voice channel to stop the music!"
        //     );
        const queue = this.getGuildQueue(context)
        queue.songs = [];
        queue.connection.dispatcher.end();
    }

    pause(context) {
        const queue = this.getGuildQueue(context)
        if (queue.connection.dispatcher == null) {
            return
        }
        queue.connection.dispatcher.pause()
    }

    resume(context) {
        const queue = this.getGuildQueue(context)
        if (queue.connection.dispatcher == null) {
            return
        }
        queue.connection.dispatcher.resume()
    }

    /**
     *
     * @param {DiscordContext} context
     * @param {int} mode - 0 for start, 1 for end
     */
    playAudioAck(context, mode) {
        const file = mode === 0 ? this.siri_ack_start : this.siri_ack_finish
        const hotwordAckStream = convertMp3ToOpus(file)
        this.playAudioEvent(context, hotwordAckStream)
    }

    /**
     *
     * @param {DiscordContext} context
     * @param {ReadableStream} audioStream
     */
    playAudioEvent(context, audioStream) {
        const currentSong = this.getGuildQueue(context).songs[0]
        if (currentSong && currentSong.stream) {
            currentSong.stream.unpipe()
            currentSong.stream.pause()
        }
        context.getVoiceConnection().play(audioStream).on('finish', () => {
            this.playSong(context, currentSong, true)
        })
    }

    /**
     *
     * @param {DiscordContext} context
     * @param {MessageContext} msgContext
     * @param {string} args
     * @returns {Promise<void>}
     */
    async play(context, msgContext, args) {
        const url = await search.searchYoutube(args)
        this.responder.startTyping(context)
        const songInfo = await ytdl.getInfo(url);
        this.responder.stopTyping(context)
        const song = {
            title: songInfo.title,
            url: songInfo.video_url,
            thumbnail: songInfo.thumbnail_url,
            author: songInfo.author,
            length: songInfo.length_seconds,
            requester: msgContext.getUser().id,
            stream: null
        }
        const queue = this.getGuildQueue(context)
        queue.songs.push(song)
        if (queue.songs.length === 1) {
            this.playSong(context, queue.songs[0])
        } else {
            this.responder.remove(context, 'queue')
            this.responder.respond(context, embedder.createQueueEmbed(queue.songs, song), 'queue')
            console.log(`${song.title} was added to the queue, new queue size ${queue.songs.length}`)
        }
    }

    /**
     *
     * @param {DiscordContext} context
     * @param {Object} song
     * @param {boolean} resume
     * @returns {Promise<void>}
     */
    async playSong(context, song, resume = false) {
        const queue = this.guildQueues.get(context.getGuildId());
        if (!song || (resume && !song.stream)) {
            return
        }
        if (!resume) {
            song.stream = await ytdl(song.url, {
                quality: 'highestaudio',
                highWaterMark: 1024 * 1024 * 10
            })
        } else {
            song.stream.resume()
        }
        queue.connection
            .play(song.stream, {
                type: 'opus',
                volume: '0.25',
                highWaterMark: 48
            })
            .on('start', () => {
                if (!resume) {
                    this.responder.respond(context, embedder.createNowPlayingEmbed(song), 'play')
                }
            })
            .on('finish', () => {
                this.responder.remove(context, 'play')
                this.responder.remove(context, 'queue')
                this.playNext(context, queue)
            })
            .on('error', error => console.error(error))
        if (song) {
            console.log(`Start playing: **${song.title}**`);
        }
    }

    /**
     *
     * @param {DiscordContext} context
     * @param {Object} queue
     */
    playNext(context, queue) {
        queue.songs.shift();
        this.playSong(context, queue.songs[0]);
    }
}

/**
 *
 * @param inputPath
 * @returns {ReadStream}
 */
function convertMp3ToOpus(inputPath) {
    const opus = new prism.opus.Encoder({rate: 48000, channels: 2, frameSize: 960});
    const transcoder = new prism.FFmpeg({
        args: [
            '-analyzeduration', '0',
            '-loglevel', '0',
            '-f', 's16le',
            '-ar', '48000',
            '-ac', '2',
        ],
    });
    const mp3Stream = fs.createReadStream(inputPath);
    mp3Stream.pipe(transcoder).pipe(opus)
    return mp3Stream
}

module.exports.DJ = DJ