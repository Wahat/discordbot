'usestrict';
varTransform=require('stream').Transform;
varutil=require('util');
vardefaults=require('defaults');
constconvert=require('pcm-convert')

varTARGET_SAMPLE_RATE=16000;

//http://watson-developer-cloud.github.io/speech-javascript-sdk/master/speech-to-text_webaudio-l16-stream.js.html#line195

/**
*TransformsBuffersorAudioBuffersintoabinarystreamofl16(rawwav)audio,downsamplingintheprocess.
*
*Thewatsonspeech-to-textserviceworkson16kHzandinternallydownsamplesaudioreceivedathighersamplerates.
*WebAudioisusually44.1kHzor48kHz,sodownsamplingherereducesbandwidthusageby~2/3.
*
*Formatevent+streamcanbecombinedwithhttps://www.npmjs.com/package/wavtogenerateawavfilewithaproperheader
*
*Todo:supportmulti-channelaudio(forusewith<audio>/<video>elements)-willrequireinterleavingaudiochannels
*
*@param{Object}options
*@constructor
*/
functionDownsamplingstream(options){
options=this.options=defaults(options,{
sourceSampleRate:48000,
downsample:true
});
Transform.call(this,options);
this.bufferUnusedSamples=[];
this._transform=this.transformBuffer;
process.nextTick(this.emitFormat.bind(this));
}

util.inherits(Downsamplingstream,Transform);

Downsamplingstream.prototype.emitFormat=functionemitFormat(){
this.emit('format',{
channels:1,
bitDepth:16,
sampleRate:this.options.downsample?TARGET_SAMPLE_RATE:this.options.sourceSampleRate,
signed:true,
float:false
});
};
/**
*DownsamplesWebAudioto16kHz.
*
*BrowserscandownsampleWebAudionativelywithOfflineAudioContext'sbutitwasdesignedfornon-streaminguseand
*requiresanewcontextforeachAudioBuffer.Firefoxcanhandlethis,butchrome(v47)crashesafterafewminutes.
*So,we'lldoitinJSfornow.
*
*Thisreallybelongsinit'sownstream,butthere'snowaytocreatenewAudioBufferinstancesfromJS,soits
*fairlycoupledtothewavconversioncode.
*
*@param{AudioBuffer}bufferNewSamplesMicrophone/MediaElementaudiochunk
*@return{Float32Array}'audio/l16'chunk
*/
Downsamplingstream.prototype.downsample=functiondownsample(bufferNewSamples){
varbuffer=null;
varnewSamples=bufferNewSamples.length;
varunusedSamples=this.bufferUnusedSamples.length;
vari;
varoffset;
if(unusedSamples>0){
buffer=newFloat32Array(unusedSamples+newSamples);
for(i=0;i<unusedSamples;++i){
buffer[i]=this.bufferUnusedSamples[i];
}
for(i=0;i<newSamples;++i){
buffer[unusedSamples+i]=bufferNewSamples[i];
}
}else{
buffer=bufferNewSamples;
}
//Downsamplingandlow-passfilter:
//Inputaudioistypically44.1kHzor48kHz,thisdownsamplesitto16kHz.
//ItusesaFIR(finiteimpulseresponse)Filtertoremove(or,atleastattinuate)
//audiofrequencies>~8kHzbecausesampledaudiocannotaccuratelyrepresent
//frequienciesgreaterthanhalfofthesamplerate.
//(Humanvoicetopsoutat<4kHz,sonothingimportantislostfortranscription.)
//Seehttp://dsp.stackexchange.com/a/37475/26392foragoodexplinationofthiscode.
varfilter=[
-0.037935,
-0.00089024,
0.040173,
0.019989,
0.0047792,
-0.058675,
-0.056487,
-0.0040653,
0.14527,
0.26927,
0.33913,
0.26927,
0.14527,
-0.0040653,
-0.056487,
-0.058675,
0.0047792,
0.019989,
0.040173,
-0.00089024,
-0.037935
];
varsamplingRateRatio=this.options.sourceSampleRate/TARGET_SAMPLE_RATE;
varnOutputSamples=Math.floor((buffer.length-filter.length)/samplingRateRatio)+1;
varoutputBuffer=newFloat32Array(nOutputSamples);
for(i=0;i+filter.length-1<buffer.length;i++){
offset=Math.round(samplingRateRatio*i);
varsample=0;
for(varj=0;j<filter.length;++j){
sample+=buffer[offset+j]*filter[j];
}
outputBuffer[i]=sample;
}
varindexSampleAfterLastUsed=Math.round(samplingRateRatio*i);
varremaining=buffer.length-indexSampleAfterLastUsed;
if(remaining>0){
this.bufferUnusedSamples=newFloat32Array(remaining);
for(i=0;i<remaining;++i){
this.bufferUnusedSamples[i]=buffer[indexSampleAfterLastUsed+i];
}
}else{
this.bufferUnusedSamples=newFloat32Array(0);
}
returnoutputBuffer;
};
/**
*AcceptsaFloat32ArrayofaudiodataandconvertsittoaBufferofl16audiodata(rawwav)
*
*Explanationforthemath:TherawvaluescapturedfromtheWebAudioAPIare
*in32-bitFloatingPoint,between-1and1(perthespecification).
*Thevaluesfor16-bitPCMrangebetween-32768and+32767(16-bitsignedinteger).
*Filter&combinesamplestoreducefrequency,thenmultiplytoby0x7FFF(32767)toconvert.
*Storeinlittleendian.
*
*@param{Float32Array}input
*@return{Buffer}
*/
Downsamplingstream.prototype.floatTo16BitPCM=function(input){
varoutput=newDataView(newArrayBuffer(input.length*2));//lengthisinbytes(8-bit),so*2toget16-bitlength
for(vari=0;i<input.length;i++){
varmultiplier=input[i]<0?0x8000:0x7fff;//16-bitsignedrangeis-32768to32767
output.setInt16(i*2,input[i]*multiplier|0,true);//index,value,littleedian
}
returnBuffer.from(output.buffer);
};

/**
*AcceptsaBuffer(forbinarymode),thendownsamplesto16000andconvertstoa16-bitpcm
*
*@param{Buffer}nodebuffer
*@param{String}encoding
*@param{Function}next
*/
Downsamplingstream.prototype.transformBuffer=function(nodebuffer,encoding,next){
varsource=convert(nodebuffer,'int16monointerleavedle','float32interleavedle');
if(this.options.downsample){
source=this.downsample(source);
}
this.push(this.floatTo16BitPCM(source));
next();
};

module.exports=Downsamplingstream;