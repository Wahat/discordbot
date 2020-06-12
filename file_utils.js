constfs=require('fs')


functionopenJsonFile(filePath){
if(!fs.existsSync(filePath)){
return{}
}
letrawdata=fs.readFileSync(filePath);
returnJSON.parse(rawdata)
}
/**
*
*@param{string}filePath
*@param{boolean}sync
*@paramcallback
*/
functiondeleteFile(filePath,sync=true,callback=()=>{}){
if(sync){
if(fs.existsSync(filePath)){
fs.unlinkSync(filePath)
}
}else{
if(fs.existsSync(filePath)){
fs.unlink(filePath,callback)
}
}
}

module.exports.deleteFile=deleteFile
module.exports.openJsonFile=openJsonFile