constfileUtils=require('./file_utils.js')

classKeys{
constructor(){
/**@member{Map<string,string>}**/
this.keys=newMap()
this.loadKeysFromJson()
}

/**
*
*@param{string}key
*@returns{string}
*/
get(key){
return(this.keys.has(key))?this.keys.get(key):process.env[key]
}

loadKeysFromJson(){
constjson=fileUtils.openJsonFile('./keys.json')
Object.keys(json).forEach(key=>{
this.keys.set(key,json[key])
})
}
}

module.exports.Key=newKeys()