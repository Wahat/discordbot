constspeechRecognizer=require('./SpeechRecognition/SpeechRecognition.js').SpeechRecognition
constsnowboy=require('./snowboy.js').Snowboy
conststream=require('stream')
constaudioUtils=require('./audio_utils.js')
constctx=require('./context.js')
constrecorder=require('./recorder.js')
constembedder=require('./embedder.js').Embedder
constfs=require('fs')
consttextResponder=require('./responder.js').TextResponder
constguild=require('./guild.js').GuildHandler

classAudioHandler{
constructor(){
/**@member{Map<string><GuildAudioContext>}**/
this.guilds=newMap()
/**@member{Map<string><number>}**/
this.recentlyRemoved=newMap()
/**@member{boolean}**/
this.isListeningToCommand=false
/**@member{EventEmitter|module:events.internal.EventEmitter}**/
this.guildsEventReceiver=undefined
/**@member{EventEmitter|module:events.internal.EventEmitter}**/
this.commandsEventEmitter=undefined
}

/**
*
*@param{GuildContext|MessageContext}context
*@returns{GuildAudioContext}
*/
getGuildAudioContext(context){
constguildId=context.getGuild().id
if(!this.guilds.has(guildId)){
console.log(`Missingaudiocontextfor${guildId}`)
this.guilds.set(guildId,newctx.GuildAudioContext())
}
returnthis.guilds.get(guildId)
}

/**
*
*@param{GuildContext}context
*/
resetGuild(context){
this.getGuildAudioContext(context).clearAudioStreams()
snowboy.clearDetectors()
this.guilds.delete(context.getGuild().id)
}

/**
*
*@param{EventEmitter|module:events.internal.EventEmitter}eventEmitter
*/
registerCommandsEventEmitter(eventEmitter){
this.commandsEventEmitter=eventEmitter
}

/**
*
*@param{EventEmitter|module:events.internal.EventEmitter}eventReceiver
*/
registerGuildsEventReceiver(eventReceiver){
this.guildsEventReceiver=eventReceiver
this.guildsEventReceiver.on('userLeftChannel',(guildId,userId)=>{
constcontext=guild.getGuildContextFromId(guildId)
if(!context){
return
}
constaudioContext=this.getGuildAudioContext(context)
console.log(`Removing${userId}`)
this.recentlyRemoved.set(userId,Date.now())
audioContext.removeAudioStream(userId)
snowboy.remove(guildId,userId)
})
}

/**
*
*@param{GuildContext}context
*/
registerConnection(context){
constconnection=context.getVoiceConnection()
if(this.guilds.has(context.getGuild().id)||!connection){
return
}
audioUtils.playSilentAudioStream(connection)
this.getGuildAudioContext(context)//Createtheaudiocontext
connection.on('speaking',(user,speaking)=>{
if(user===undefined){
console.log("Userisundefined")
return
}
if(this.getGuildAudioContext(context).hasAudioStream(user.id)||user.bot){
return
}
if(this.recentlyRemoved.has(user.id)){
console.log(`timedifference${Date.now()-this.recentlyRemoved.get(user.id)}`)
}
if(this.recentlyRemoved.has(user.id)&&(Date.now()-this.recentlyRemoved.get(user.id))<300){
this.recentlyRemoved.delete(user.id)
return
}
this.startListeningToUser(context,user)
})

connection.on('ready',()=>{
console.log('Connectionready')
})

connection.on('newSession',()=>{
console.log('NewSession')
})

connection.on('warning',warning=>{
console.log(`Warning:${warning}`)
})

connection.on('error',err=>{
console.log(`Error:${err.name},${err.message}`)
})

connection.on('reconnecting',()=>{
console.log('Reconnecting')
})

connection.on('disconnect',()=>{
console.log(`Disconnectingfrom${connection.channel.guild.name}`)
this.resetGuild(context)
})
}

/**
*
*@param{GuildContext}context
*@param{User}user
*/
startListeningToUser(context,user){
console.log(`Registering${user.tag}=>${user.id}`)
constconnection=context.getVoiceConnection()
letaudio=connection.receiver.createStream(user,{
mode:'pcm',
end:'manual'
})
constrecorderStream=newrecorder.Recorder()
audio.pipe(recorderStream)
this.getGuildAudioContext(context).setAudioStream(user.id,recorderStream)
snowboy.recognize(context,user.id,recorderStream,(trigger)=>{
if(this.isListeningToCommand){
console.log('Alreadylisteningforacommand')
return
}
this.isListeningToCommand=true
this.commandsEventEmitter.emit('playHotwordAudioAck',context,0)
constrecognitionStream=newstream.PassThrough()
recorderStream.pipe(recognitionStream)
speechRecognizer.runSpeechRecognition(recognitionStream,data=>{
console.log(`${user.tag}said${data}`)
this.commandsEventEmitter.emit('command',newctx.MessageContext(user,data.toString(),
context.getTextChannel(),null,connection))
})
setTimeout(()=>{
recognitionStream.end()
recognitionStream.destroy()
this.commandsEventEmitter.emit('playHotwordAudioAck',context,1)
this.isListeningToCommand=false
},3000)
})
}

/**
*
*@param{MessageContext}context
*@param{User}user
*@param{string}caption
*@paramlength
*@param{boolean}transcribe
*/
recordUserToFile(context,user,caption="Clip",length=0,transcribe=false){
constaudioStream=this.getGuildAudioContext(context).getAudioStream(user.id)
if(audioStream==null){
console.log(`NoaudioStreamfor${user.tag}`)
return
}
constoutputFile=`./clips/${user.tag}_recorded.mp3`
audioUtils.writeStreamToMp3File(audioStream.getBuffer(),outputFile,caption,user.tag,err=>{
if(err){
console.log(`Therewasanerrorwriting${outputFile}tomp3:${err.toString()}`)
return
}
textResponder.respond(context,embedder.createRecordingFileEmbed(outputFile,caption,user.id),'',msg=>{
fs.unlink(outputFile,error=>{
if(error){
console.log(`Therewasanerrordeleting${outputFile}`)
}
})
})
})
}

/**
*
*@param{MessageContext}context
*@param{User}user
*@paramlength
*/
replayUser(context,user,length){
constaudioStream=this.getGuildAudioContext(context).getAudioStream(user.id)
if(audioStream==null){
console.log(`NoaudioStreamfor${user.tag}`)
return
}
this.commandsEventEmitter.emit('playAudioWavStream',context,audioStream.getRecordedStream())
}
}

module.exports.AudioHandler=AudioHandler