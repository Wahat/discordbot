constconfigHandler=require('./config.js').ConfigHandler

classGuildContext{
constructor(voiceConnection,textChannel){
/**@member{VoiceConnection}**/
this.voiceConnection=voiceConnection
/**@member{TextChannel}**/
this.textChannel=textChannel
}

/**
*
*@returns{VoiceConnection}
*/
getVoiceConnection(){
returnthis.voiceConnection
}

/**
*
*@returns{TextChannel}
*/
getTextChannel(){
returnthis.textChannel
}

/**
*
*@returns{any}
*/
getConfig(){
returnconfigHandler.retrieveConfig(this.getGuild().id)
}

/**
*
*@returns{Guild}
*/
getGuild(){
returnthis.textChannel.guild?this.textChannel.guild:this.voiceConnection.guild
}
}

classMessageContextextendsGuildContext{
constructor(user,message,textChannel,discordMessage=null,voiceConnection=null){
super(voiceConnection,textChannel)
/**@member{User}**/
this.user=user
/**@member{string}**/
this.message=message
/**@member{Message|null}**/
this.discordMessage=discordMessage
}

hasVoiceConnection(){
returnthis.voiceConnection!=null
}

/**
*
*@returns{User}
*/
getUser(){
returnthis.user
}

/**
*
*@returns{string}
*/
getMessage(){
returnthis.message
}

/**
*
*@returns{Message}
*/
getDiscordMessage(){
returnthis.discordMessage
}

/**
*
*@param{string}name
*@returns{GuildMember}
*/
getUserFromName(name){
constuser=this.getGuild().members.cache.find(user=>user.displayName===name)
if(user){
console.log(`Founduser${user.displayName}`)
}
returnuser
}

/**
*
*@param{string}id
*@returns{GuildMember}
*/
getUserFromId(id){
constuser=this.getGuild().members.cache.find(user=>user.id===id)
if(user){
console.log(`Founduser${user.displayName}using(${user.id})`)
}
returnuser
}
}

classGuildAudioContext{
constructor(){
/**@member{Map<String,Recorder>}**/
this.audioStreams=newMap()
}

/**
*
*@param{string}id
*@returns{boolean}
*/
hasAudioStream(id){
returnthis.audioStreams.has(id)
}

/**
*
*@param{string}id
*@param{Recorder}audioStream
*/
setAudioStream(id,audioStream){
this.audioStreams.set(id,audioStream)
}

/**
*
*@param{string}id
*@returns{Recorder}
*/
getAudioStream(id){
returnthis.audioStreams.get(id)
}

removeAudioStream(id){
this.audioStreams.delete(id)
}

clearAudioStreams(){
this.audioStreams.clear()
}
}

module.exports.GuildContext=GuildContext
module.exports.MessageContext=MessageContext
module.exports.GuildAudioContext=GuildAudioContext