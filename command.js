constevents=require('events')
constctx=require('./context.js')
constembedder=require('./embedder').Embedder
constguildHandler=require('./guild.js').GuildHandler

constcommandConfig=require(`./commands_config.json`)

classCommandHandler{
/**
*
*@param{DJHandler}dj
*@param{AudioHandler}audioHandler
*/
constructor(dj,audioHandler){
/**@member{DJHandler}**/
this.dj=dj
/**@member{AudioHandler}**/
this.audioHandler=audioHandler
/**@member{TextResponder}**/
this.textResponder=require('./responder.js').TextResponder
/**@member{EventEmitter|module:events.internal.EventEmitter}**/
this.eventReceiver=newevents.EventEmitter()

this.eventReceiver.on('playHotwordAudioAck',(context,mode,callback)=>{
this.dj.playHotwordAudioAck(context,mode,callback)
})

this.eventReceiver.on('command',(msgContext)=>{
this.onCommandReceived(msgContext)
})

this.eventReceiver.on('playAudioWavStream',(context,stream)=>{
this.dj.playAudioWavStream(context,stream)
})

this.eventReceiver.on('error',(context,msg)=>{

})
}

/**
*
*@param{MessageContext}msgContext
*/
onCommandReceived(msgContext){
constyargs=require('yargs-parser')(msgContext.getMessage())
letcommandType=parseCommand(yargs['_'].shift().toLowerCase())
if(commandConfig["commands"][commandType]){
/**@type{Collection}**/
constcommandArgs=commandConfig["commands"][commandType]["args"]
constparsedArgs={}
if(yargs['h']){
this.textResponder.showCommandHelp(msgContext,commandConfig,commandType)
return
}
letfailedArg=false
commandArgs.forEach(commandArg=>{
parsedArgs[commandArg["name"]]=commandArg["flag"]==="_"&&yargs[commandArg["flag"]]
?yargs[commandArg["flag"]].join(''):yargs[commandArg["flag"]]
if(commandArg["required"]&&!parsedArgs[commandArg["name"]]){
this.textResponder.respond(msgContext,
embedder.createBasicMessageEmbed(`${commandType}requires${commandArg["name"]}parameter(${commandArg["flag"]})`))
failedArg=true
return
}
if(commandArg["integer"]&&!isNumeric(parsedArgs[commandArg["name"]])){
this.textResponder.respond(msgContext,
embedder.createBasicMessageEmbed(`${commandArg["name"]}parametermustbeinteger`),
'error')
failedArg=true
}elseif(commandArg["integer"]){
parsedArgs[commandArg["name"]]=parseInt(parsedArgs[commandArg["name"]])
}
})
if(failedArg){
return
}
constcommandExec=commandConfig["commands"][commandType]["command"]
constexecArgs=[]
letinvalidArg=false
commandExec["args"].forEach(arg=>{
letparsedArg=parsedArgs[arg]
if(parsedArg==null&&!commandArgs.find(commandArg=>commandArg["name"]===arg)){
parsedArg=arg
}
try{
parsedArg=preParseSpecificArgumentsIfNeeded(this.textResponder,msgContext,arg,parsedArg)
}catch{
invalidArg=true
}
execArgs.push(parsedArg)
})
if(invalidArg){
return
}
this[commandExec["handler"]][commandExec["name"]](msgContext,...execArgs)
}
}
}

/**
*
*@param{TextResponder}textResponder
*@param{MessageContext}msgContext
*@param{string}arg
*@param{string|GuildMember}parsedArg
*@returns{GuildMember|int}
*/
functionpreParseSpecificArgumentsIfNeeded(textResponder,msgContext,arg,parsedArg){
switch(arg){
case"user":
parsedArg=parseUser(msgContext,parsedArg)
if(!parsedArg){
textResponder.respond(msgContext,
embedder.createBasicMessageEmbed(`Invaliduserprovided(Displayname/Nickname/Mention)`))
throw('Invaliduserprovided')
}
}
returnparsedArg
}

/**
*Ifcommandargumentislabelled"user",thiscommandiscalledbydefault
*@param{MessageContext}context
*@param{string}input
*/
functionparseUser(context,input){
constguildConfig=guildHandler.getGuildContextFromId(context.getGuild().id)
letuser=context.getUserFromName(input)
if(!user){
user=context.getUserFromId(parseMention(input))
if(!user){
input=guildConfig.getConfig()["nicknames"][input]
user=context.getUserFromId(input)
}
}
returnuser
}

/**
*Mentionsarepassedas<@!1111111111111>
*@param{string}input
*@return{string|null}
*/
functionparseMention(input){
constparsedId=input.match(/^<@!?(\d+)>$/)
if(parsedId!=null){
returnparsedId[1]
}
returnnull
}

/**
*@param{string}input
*@returns{string}
*/
functionparseCommand(input){
input=input.trim()
returninput
}

/**
*
*@param{string}value
*@returns{boolean}
*/
functionisNumeric(value){
return/^\d+$/.test(value);
}

module.exports.CommandHandler=CommandHandler