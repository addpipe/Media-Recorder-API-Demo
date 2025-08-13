'use strict';

/* globals MediaRecorder */
// Spec is at http://dvcs.w3.org/hg/dap/raw-file/tip/media-stream-capture/RecordingProposal.html

var constraints = {audio:true,video:{width:{min:640,ideal:1280,max:1280 },height:{ min:480,ideal:720,max:720},framerate:60}};

var recBtn = document.querySelector('button#rec');
var pauseResBtn = document.querySelector('button#pauseRes');
var stopBtn = document.querySelector('button#stop');

var liveVideoElement = document.querySelector('#live');
var playbackVideoElement = document.querySelector('#playback');
var dataElement = document.querySelector('#data');
var downloadLink = document.querySelector('a#downloadLink');
const cameraSelect = document.getElementById('cameraSelect');
const resSelect = document.getElementById('resolutionSelect');

liveVideoElement.controls = false;
playbackVideoElement.controls=false;

var mediaRecorder;
var chunks = [];
var count = 0;
var localStream = null;
var soundMeter  = null;
var containerType = "video/webm"; //defaults to webm but we switch to mp4 on Safari 14.0.2+
let currentDeviceId = "";
let currentResolution = "hd";

const resolutions = {
	sd: { width: { ideal: 640 }, height: { ideal: 480 }, framerate:60 },
	hd: { width: { ideal: 1280 }, height: { ideal: 720 }, framerate:60 },
	fhd: { width: { ideal: 1920 }, height: { ideal: 1080 }, framerate:60 },
	fourK: { width: { ideal: 3840 }, height: { ideal: 2160 }, framerate:60 },
}

async function populateDevices() {
	const devices = await navigator.mediaDevices.enumerateDevices();
	const videos = devices.filter(d => d.kind === 'videoinput');

	cameraSelect.innerHTML = '';
	videos.forEach((d, i) => {
		const opt = document.createElement('option');
		opt.value = d.deviceId;
		opt.textContent = d.label || `Camera ${i + 1}`;
		cameraSelect.appendChild(opt);
	});
}

const callGetUserMedia = (deviceId = currentDeviceId, resolution = currentResolution) => {
	let localConstraints = { ...constraints };

	if (!!resolution) {
		localConstraints.video = { ...resolutions[resolution] };
		currentResolution = resolution;
	}

	if (!!deviceId) {
		localConstraints.video = { ...localConstraints.video, deviceId: { exact: deviceId } };
	}

	// Stop old tracks
	localStream && localStream.getTracks().forEach(track => track.stop());

	navigator.mediaDevices.getUserMedia(localConstraints)
		.then(function(stream) {
			localStream = stream;
			
			localStream.getTracks().forEach(function(track) {
				if(track.kind == "audio"){
					track.onended = () => log("audio track.onended track.readyState="+track.readyState+", track.muted=" + track.muted);
					track.onmute = () => log("audio track.onmute track.readyState="+track.readyState+", track.muted=" + track.muted);
					track.onunmute = () => log("audio track.onunmute track.readyState="+track.readyState+", track.muted=" + track.muted);
				}
				if(track.kind == "video"){
					track.onended = () => log("video track.onended track.readyState="+track.readyState+", track.muted=" + track.muted);
					track.onmute = () => log("video track.onmute track.readyState="+track.readyState+", track.muted=" + track.muted);
					track.onunmute = () => log("video track.onunmute track.readyState="+track.readyState+", track.muted=" + track.muted);
				}
			});
			
			liveVideoElement.srcObject = localStream;
			liveVideoElement.play();
			
			try {
				window.AudioContext = window.AudioContext || window.webkitAudioContext;
				window.audioContext = new AudioContext();
				} catch (e) {
				log('Web Audio API not supported.');
				}

				soundMeter = window.soundMeter = new SoundMeter(window.audioContext);
				soundMeter.connectToSource(localStream, function(e) {
				if (e) {
					log(e);
					return;
				}else{
						/*setInterval(function() {
						log(Math.round(soundMeter.instant.toFixed(2) * 100));
					}, 100);*/
				}
				});
				if (deviceId) {
					currentDeviceId = deviceId;
				} else {
					populateDevices();
				}
			
		}).catch(function(err) {
			/* handle the error */
			log('navigator.getUserMedia error: '+err);
		});
}

cameraSelect.addEventListener("change", (e) => {
	callGetUserMedia(e.target.value);
})

resSelect.addEventListener("change", (e) => {
	callGetUserMedia(currentDeviceId, e.target.value);
})

if (!navigator.mediaDevices.getUserMedia){
	alert('navigator.mediaDevices.getUserMedia not supported on your browser, use the latest version of Safari, Edge, Firefox or Chrome');
}else{
	if (window.MediaRecorder == undefined) {
			alert('MediaRecorder not supported on your browser, use the latest version of Safari, Edge, Firefox or Chrome');
	}else{
		callGetUserMedia();
	}
}

function onBtnRecordClicked (){
	if (localStream == null) {
		alert('Could not get local stream from mic/camera');
	}else {
		recBtn.disabled = true;
		pauseResBtn.disabled = false;
		stopBtn.disabled = false;

		chunks = [];

		/* use the stream */
		log('Start recording...');
		if (typeof MediaRecorder.isTypeSupported == 'function'){
			/*
				MediaRecorder.isTypeSupported is a function announced in https://developers.google.com/web/updates/2016/01/mediarecorder and later introduced in the MediaRecorder API spec http://www.w3.org/TR/mediastream-recording/
			*/
			function tryMimeTypes(mimeTypes) {
				for (const mime of mimeTypes) {
					log(`Check if format is supported: ${mime}`)
					if (MediaRecorder.isTypeSupported(mime)) {
						try {
							const testMediaRecorder = new MediaRecorder(localStream, { mimeType: mime });
							testMediaRecorder.start();
							testMediaRecorder.stop();
							return mime;
						} catch (err) {
							log(`Supported but failed to init recorder: ${mime}`, err);
						}
					} else {
						log(`Not supported: ${mime}`)
					}
				}
				return null;
			}

			// HEVC (H.265) variants
			const hevcTypes = [
				'video/mp4;codecs=hvc1.1.6.L93.B0', // Main profile, Level 4.1
				'video/mp4;codecs=hvc1.1.6.L123.B0', // Main profile, Level 5.1
				'video/mp4;codecs=hvc1', // Generic
				'video/mp4;codecs=hev1.1.6.L93.B0', // Alternative HEVC brand
				'video/mp4;codecs=hev1' // Generic alternative
			];

			// AV1 variants
			const av1Types = [
				'video/mp4;codecs=av01.0.08M.08', // Main profile, Level 4, 8-bit
				'video/mp4;codecs=av01.0.12M.08', // Main profile, Level 5, 8-bit
				'video/mp4;codecs=av01.0.08M.10', // Main profile, Level 4, 10-bit
				'video/mp4;codecs=av01' // Generic
			];

			// VP9 / VP8 / H.264
			const vp9Types = [
				'video/webm;codecs=vp9.0',
				'video/webm;codecs=vp9'
			];

			const vp8Types = [
				'video/webm;codecs=vp8'
			];

			const h264Types = [
				'video/webm;codecs=avc1.42E01E', // Baseline
				'video/webm;codecs=avc1.4D401E', // Main
				'video/webm;codecs=avc1'         // Generic
			];

			// Generic fallbacks
			const webmTypes = [
				'video/webm'
			];

			const mp4Types = [
				'video/mp4'
			];

			// Check in priority order
			let mime = tryMimeTypes(hevcTypes) ||
								tryMimeTypes(av1Types) ||
								tryMimeTypes(vp9Types) ||
								tryMimeTypes(vp8Types) ||
								tryMimeTypes(h264Types) ||
								tryMimeTypes(webmTypes) ||
								tryMimeTypes(mp4Types);

			if (!mime) {
				log("No supported MediaRecorder formats found.");
			} else {
				const options = { mimeType: mime };
				let extension;
				if (mime.includes('mp4')) {
					containerType = 'video/mp4';
					extension = '.mp4';
				} else {
					containerType = 'video/webm';
					extension = '.webm';
				}
				log(`Selected format: ${mime} (${extension})`);
				mediaRecorder = new MediaRecorder(localStream, options);
			}
		}else{
			log('isTypeSupported is not supported, using default codecs for browser');
			mediaRecorder = new MediaRecorder(localStream);
		}

		mediaRecorder.ondataavailable = function(e) {
			log('mediaRecorder.ondataavailable, e.data.size='+e.data.size+', e.timecode='+e.timecode);
			if (e.data && e.data.size > 0) {
				chunks.push(e.data);
			}
		};

		mediaRecorder.onerror = function(e){
			log('mediaRecorder.onerror: ' + e);
		};

		mediaRecorder.onstart = function(){
			log('mediaRecorder.onstart, mediaRecorder.state = ' + mediaRecorder.state);
			
			localStream.getTracks().forEach(function(track) {
              if(track.kind == "audio"){
                log("onstart - Audio track.readyState="+track.readyState+", track.muted=" + track.muted);
              }
              if(track.kind == "video"){
                log("onstart - Video track.readyState="+track.readyState+", track.muted=" + track.muted);
              }
            });
			
		};

		mediaRecorder.onstop = function(){
			log('mediaRecorder.onstop, mediaRecorder.state = ' + mediaRecorder.state);

			//var recording = new Blob(chunks, {type: containerType});
			var recording = new Blob(chunks, {type: mediaRecorder.mimeType});
			

			downloadLink.href = URL.createObjectURL(recording);

			/* 
				srcObject code from https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/srcObject
			*/

			/*if ('srcObject' in playbackVideoElement) {
			  try {
			    playbackVideoElement.srcObject = recording;
			  } catch (err) {
			    if (err.name != "TypeError") {
			      throw err;
			    }*/
			    // Even if they do, they may only support MediaStream
			    playbackVideoElement.src = URL.createObjectURL(recording);
			/*  }
			} else {
			  playbackVideoElement.src = URL.createObjectURL(recording);
			} */

			playbackVideoElement.controls = true;
			playbackVideoElement.play();

			var rand =  Math.floor((Math.random() * 10000000));
			switch(containerType){
				case "video/mp4":
					var name  = "video_"+rand+".mp4" ;
					break;
				default:
					var name  = "video_"+rand+".webm" ;
			}

			downloadLink.innerHTML = 'Download '+name;

			downloadLink.setAttribute( "download", name);
			downloadLink.setAttribute( "name", name);
		};

		mediaRecorder.onpause = function(){
			log('mediaRecorder.onpause, mediaRecorder.state = ' + mediaRecorder.state);
		}

		mediaRecorder.onresume = function(){
			log('mediaRecorder.onresume, mediaRecorder.state = ' + mediaRecorder.state);
		}

		mediaRecorder.onwarning = function(e){
			log('mediaRecorder.onwarning: ' + e);
		};

		pauseResBtn.textContent = "Pause";

		mediaRecorder.start(1000);

		localStream.getTracks().forEach(function(track) {
			log(track.kind+":"+JSON.stringify(track.getSettings()));
			console.log(track.getSettings());
		})
	}
}

navigator.mediaDevices.ondevicechange = function(event) {
	log("mediaDevices.ondevicechange");
	/*
	if (localStream != null){
		localStream.getTracks().forEach(function(track) {
			if(track.kind == "audio"){
				track.onended = function(event){
					log("audio track.onended");
				}
			}
		});
	}
	*/
}

function onBtnStopClicked(){
	mediaRecorder.stop();
	recBtn.disabled = false;
	pauseResBtn.disabled = true;
	stopBtn.disabled = true;
}

function onPauseResumeClicked(){
	if(pauseResBtn.textContent === "Pause"){
		pauseResBtn.textContent = "Resume";
		mediaRecorder.pause();
		stopBtn.disabled = true;
	}else{
		pauseResBtn.textContent = "Pause";
		mediaRecorder.resume();
		stopBtn.disabled = false;
	}
	recBtn.disabled = true;
	pauseResBtn.disabled = false;
}

function onStateClicked(){
	
	if(mediaRecorder != null && localStream != null && soundMeter != null){
		log("mediaRecorder.state="+mediaRecorder.state);
		log("mediaRecorder.mimeType="+mediaRecorder.mimeType);
		log("mediaRecorder.videoBitsPerSecond="+mediaRecorder.videoBitsPerSecond);
		log("mediaRecorder.audioBitsPerSecond="+mediaRecorder.audioBitsPerSecond);

		localStream.getTracks().forEach(function(track) {
			if(track.kind == "audio"){
				log("Audio: track.readyState="+track.readyState+", track.muted=" + track.muted);
			}
			if(track.kind == "video"){
				log("Video: track.readyState="+track.readyState+", track.muted=" + track.muted);
			}
		});
		
		log("Audio activity: " + Math.round(soundMeter.instant.toFixed(2) * 100));
	}
	
}

function log(message){
	dataElement.innerHTML = dataElement.innerHTML+ '<br>' + new Date().toISOString() + " " + message;
	console.log(message)
}

// Define the AudioWorkletProcessor as a string to be dynamically loaded
const volumeProcessorCode = `
class VolumeProcessor extends AudioWorkletProcessor {
	constructor() {
		super();
		this.instant = 0.0;
		this.slow = 0.0;
		this.clip = 0.0;
	}

	process(inputs, outputs, parameters) {
		const input = inputs[0];
		if (input.length > 0) {
			const channelData = input[0];
			let sum = 0.0;
			let clipcount = 0;

			for (let i = 0; i < channelData.length; ++i) {
				sum += channelData[i] * channelData[i];
				if (Math.abs(channelData[i]) > 0.99) {
					clipcount += 1;
				}
			}

			this.instant = Math.sqrt(sum / channelData.length);
			this.slow = 0.95 * this.slow + 0.05 * this.instant;
			this.clip = clipcount / channelData.length;

			this.port.postMessage({
				instant: this.instant,
				slow: this.slow,
				clip: this.clip
			});
		}

		return true;
	}
}

registerProcessor('volume-processor', VolumeProcessor);
`;

// Meter class that generates a number correlated to audio volume.
// The meter class itself displays nothing, but it makes the
// instantaneous and time-decaying volumes available for inspection.
// It also reports on the fraction of samples that were at or near
// the top of the measurement range.
class SoundMeter {
	constructor(context) {
		this.context = context;
		this.instant = 0.0;
		this.slow = 0.0;
		this.clip = 0.0;

		// Create a Blob URL for the AudioWorkletProcessor script
		// This approach is taken to avoid the need for a separate file for the processor
		const blob = new Blob([volumeProcessorCode], { type: 'application/javascript' });
		const url = URL.createObjectURL(blob);

		// Load the processor module into the AudioWorklet
		this.ready = context.audioWorklet.addModule(url).then(() => {
			// Create an AudioWorkletNode using the registered processor
			this.node = new AudioWorkletNode(context, 'volume-processor');
			// Set up a message event listener to receive volume metrics from the processor
			this.node.port.onmessage = (event) => {
				this.instant = event.data.instant;
				this.slow = event.data.slow;
				this.clip = event.data.clip;
			};
		});
	}

	async connectToSource(stream, callback) {
		console.log("pipe-log at " + new Date().toISOString() + " SoundMeter connecting");
		try {
			// Wait for the processor module to be ready
			await this.ready;
			// Create a MediaStreamSource from the provided audio stream
			this.mic = this.context.createMediaStreamSource(stream);
			// Connect the media source to the AudioWorkletNode
			this.mic.connect(this.node);
			// Connect the node to the destination to ensure it works (even though we don't need the output)
			this.node.connect(this.context.destination);
			// If a callback is provided, call it with no error
			if (typeof callback !== 'undefined') {
				callback(null);
			}
		} catch (e) {
			// Log any errors that occur during the connection process
			console.log("pipe-log at " + timeStamp() + " error occurred in SoundMeter:", e);
			// If a callback is provided, call it with the error
			if (typeof callback !== 'undefined') {
				callback(e);
			}
		}
	}

	stop() {
		// Disconnect the media source and the AudioWorkletNode to stop processing
		this.mic.disconnect();
		this.node.disconnect();
	}
}


//browser ID
function getBrowser(){
	var nVer = navigator.appVersion;
	var nAgt = navigator.userAgent;
	var browserName  = navigator.appName;
	var fullVersion  = ''+parseFloat(navigator.appVersion);
	var majorVersion = parseInt(navigator.appVersion,10);
	var nameOffset,verOffset,ix;

	// In Opera, the true version is after "Opera" or after "Version"
	if ((verOffset=nAgt.indexOf("Opera"))!=-1) {
	 browserName = "Opera";
	 fullVersion = nAgt.substring(verOffset+6);
	 if ((verOffset=nAgt.indexOf("Version"))!=-1)
	   fullVersion = nAgt.substring(verOffset+8);
	}
	// In MSIE, the true version is after "MSIE" in userAgent
	else if ((verOffset=nAgt.indexOf("MSIE"))!=-1) {
	 browserName = "Microsoft Internet Explorer";
	 fullVersion = nAgt.substring(verOffset+5);
	}
	// In Chrome, the true version is after "Chrome"
	else if ((verOffset=nAgt.indexOf("Chrome"))!=-1) {
	 browserName = "Chrome";
	 fullVersion = nAgt.substring(verOffset+7);
	}
	// In Safari, the true version is after "Safari" or after "Version"
	else if ((verOffset=nAgt.indexOf("Safari"))!=-1) {
	 browserName = "Safari";
	 fullVersion = nAgt.substring(verOffset+7);
	 if ((verOffset=nAgt.indexOf("Version"))!=-1)
	   fullVersion = nAgt.substring(verOffset+8);
	}
	// In Firefox, the true version is after "Firefox"
	else if ((verOffset=nAgt.indexOf("Firefox"))!=-1) {
	 browserName = "Firefox";
	 fullVersion = nAgt.substring(verOffset+8);
	}
	// In most other browsers, "name/version" is at the end of userAgent
	else if ( (nameOffset=nAgt.lastIndexOf(' ')+1) <
		   (verOffset=nAgt.lastIndexOf('/')) )
	{
	 browserName = nAgt.substring(nameOffset,verOffset);
	 fullVersion = nAgt.substring(verOffset+1);
	 if (browserName.toLowerCase()==browserName.toUpperCase()) {
	  browserName = navigator.appName;
	 }
	}
	// trim the fullVersion string at semicolon/space if present
	if ((ix=fullVersion.indexOf(";"))!=-1)
	   fullVersion=fullVersion.substring(0,ix);
	if ((ix=fullVersion.indexOf(" "))!=-1)
	   fullVersion=fullVersion.substring(0,ix);

	majorVersion = parseInt(''+fullVersion,10);
	if (isNaN(majorVersion)) {
	 fullVersion  = ''+parseFloat(navigator.appVersion);
	 majorVersion = parseInt(navigator.appVersion,10);
	}


	return browserName;
}
