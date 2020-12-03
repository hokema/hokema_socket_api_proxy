
/* 

Define somewhere on your page SOCKETIOURL as the path 
to your socket.io service.

Redefine the following functions to have something on your UI:

hkm_start_recording_action()
hkm_stop_recording_action()
hkm_score_display_action(data)

Call the following functions to start and stop:

hkm_start_recording()
hkm_stop_recording()

But define first where to get the prompt for the utterance you want
to score and who is speaking, by redefining

hkm_get_word_to_score()
hkm_get_speaker_id()

*/




var hkm_record_timeout_ms = 4000;

var hkm_targetSampleRate = 16000
var hkm_uploadtype = 'packet_upload'
var hkm_recorder = null
var hkm_audio_input = null
var hkm_audio_context = null
var hkm_sampleRate = null
var hkm_bufferSize = 16384 //2048

var hkm_audioAnalyser = null
var hkm_fftArray = null
var hkm_fftBufferLength = 0

var hkm_recStartTime = 0


function initializeRecorder(stream) {
    var AudioContext = window.AudioContext || window.webkitAudioContext;
    hkm_audio_context = new AudioContext();

    hkm_audio_input = hkm_audio_context.createMediaStreamSource(stream);

    hkm_filter = hkm_audio_context.createBiquadFilter();
    hkm_audio_input.connect(hkm_filter);

    // Create and specify parameters for the low-pass filter.
    hkm_filter.type = 'lowpass'; // Low-pass filter. See BiquadFilterNode docs
    hkm_filter.frequency.value = 7700; // Set cutoff to 7700 HZ
    hkm_filter.Q.value = 10
    
    // create a javascript node
    hkm_recorder = hkm_audio_context.createScriptProcessor(hkm_bufferSize, 1, 1);
    // specify the processing function
    hkm_recorder.onaudioprocess = hkm_recorderProcess;
    // connect stream to our recorder

    // Connect recorder to filter output
    hkm_filter.connect(hkm_recorder);
    
    // connect our recorder to the previous destination
    hkm_recorder.connect(hkm_audio_context.destination);
    hkm_audio_context.suspend()
    console.log("Sample rate:", hkm_audio_context.sampleRate,
		"Filter frequency and Q:", hkm_filter.frequency.value,hkm_filter.Q.value)

}


function downsampleAndConvertFloat32ToInt16(buffer) {
    step = hkm_audio_context.sampleRate / hkm_targetSampleRate;

    l = Math.floor(buffer.length / step)+1
    newbuf = new Int16Array( l );
    while (--l) {
	sourcepoint = l*step
	upperpoint = Math.ceil(sourcepoint)
	lowerpoint = Math.floor(sourcepoint)
	upperweight = lowerpoint-sourcepoint
	lowerweight = 1-upperweight
	s = upperweight * buffer[upperpoint] +  lowerweight * buffer[lowerpoint];
	s = Math.max(-1,Math.min(1, s));
	newbuf[l] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }

    return newbuf.buffer;
}



function hkm_recorderProcess(e) {
    var left = e.inputBuffer.getChannelData(0);
    if ( hkm_uploadtype == 'streaming') {	
	if (hkm_stream0 != null) {
	    hkm_stream0.write(downsampleAndConvertFloat32ToInt16(left));
	}
    }
    else if (hkm_uploadtype == 'packet_upload') {
	hkm_uploadbase64(downsampleAndConvertFloat32ToInt16(left));
    }
}


function onError(e) {
    console.log("Error on loading audiocontext");
    console.log(e);
}


var session = {
    audio: true,
    video: false
};

var recordRTC = null;

navigator.getUserMedia = ( navigator.getUserMedia ||
			   navigator.webkitGetUserMedia ||
			   navigator.mozGetUserMedia ||
			   navigator.msGetUserMedia);

navigator.getUserMedia(session, initializeRecorder, onError);
//navigator.mediaDevices.getUserMedia(session, initializeRecorder, onError);




var hkm_stream0 = null;
var hkm_socket = null;
hkm_socket = io.connect({//transports: ['websocket'],
			   path: SOCKETIOURL });

var hkm_uploading = false;

hkm_socket.emit('test', { Test: "is successful?"});

// on reconnection, reset the transports option, as the Websocket
// connection may have failed (caused by proxy, firewall, browser, ...)
hkm_socket.on('reconnect_attempt', () => {
  hkm_socket.io.opts.transports = ['polling', 'websocket'];
});

hkm_socket.on('connect_error', function(err) {
    console.log("Connection to", hkm_socket.path, "failed:");
    //console.log(err);
});

hkm_socket.on('connect', function() {
    hkm_connected_action();
})

hkm_socket.on('disconnect', (reason) => {
    hkm_disconnect_action(reason);
});

hkm_socket.on('recogniser_ready', function() {
    hkm_ready_to_recognise_action();
})

hkm_socket.on('recogniser_down', function() {
    hkm_recogniser_down_action(); 
})


hkm_socket.on('score', (data) => {    
/* 
This is a sample of the data received from the server;
Here the targets were either "help" or "find" in UK English.
There's the score and rounded stars, and analytics on errors.
Also some guessed metadata for the player (age group, gender).
{
  "score": 4.35132804431797,
  "stars": 4,
  "detected_words": [
    "en_gb_help"
  ],
  "all_word_stars": {
    "en_gb_find": 1,
    "en_gb_help": 4
  },
  "expected_phones": "/ h ɛ ^ l p /",
  "gender": {
    "f": 0.8009926080703735,
    "m": 0.19900740683078766
  },
  "age": {
    "0-0": 0,
    "2-4": 0,
    "5-8": 0.0006540754693560302,
    "9-11": 0.006128447130322456,
    "12-16": 0.5645666122436523,
    "17-119": 0.4286508858203888
  },
  "player": "test_player_213431",
  "host": "`londontest-2vcpu-4gb-lon1`",
  "processing_time": 0.32388830184936523,
  "targetword": "en_gb_find or en_gb_help",
  "most_likely_hyp": " h l ",
  "best_score_hyp": " h ɛ l d ",
  "mapping": [
    ["h", "-", "h", 0 ],
    ["ɛ", "-", "ɛ", 0 ],
    ["l", "-", "l", 0 ],
    ["p", "s", "d", 0.6486719627453668 ]
  ]
}
*/
    hkm_score_display_action(data)

});

hkm_socket.on('test', (data) => {
    console.log('Received test:',data)
});
hkm_socket.on('ping', (data) => {
    console.log('Received ping:',data)
});

hkm_socket.on('speaker_start', (data) => {
    console.log('Starting with speaker')
});

/*function start_streaming_upload() {
    hkm_uploadtype = 'streaming';
    hkm_stream0 = ss.createStream({
	highWaterMark: 1024,
	objectMode: true,
	allowHalfOpen: true
    });
    hkm_audio_context.resume()    
    console.log("hkm_stream0",hkm_stream0);
    ss(hkm_socket).emit('audio_stream', hkm_stream0, { target_word : "word",
					       target_language : "en-uk",
					       source_language : "fi-fi",
					       speaker : 'webuser',
					       meta : 'webinterface' });
    console.log("Piped stream!")
    hkm_uploading = true;

}*/

var hkm_packetnr = 0


function hkm_start_recording() {
    hkm_start_recording_action();
    hkm_speaker = hkm_get_speaker_id();
    hkm_uploadtype = 'packet_upload';
    hkm_audio_context.resume();

    hkm_recStartTime = new Date();
    

    hkm_uploading = true;
    setTimeout( function() {
	console.log("Time's up, killing upload");
	hkm_stop_recording();
    }, hkm_record_timeout_ms );    
}



function hkm_stop_recording() {
    if (hkm_uploading) {
	hkm_uploading = false;

	hkm_audio_context.suspend()
	if (hkm_uploadtype == 'streaming') {
	    console.log("Suspending audio stream to", hkm_socket.id)
	    hkm_stream0.end()
	}
	else if (hkm_uploadtype == 'packet_upload') {
	    if (hkm_packetnr > 0) {
		hkm_finish_base64upload();
	    }
	    console.log("Suspending audio stream to", hkm_socket.id)
	    hkm_packetnr = 0;
	}
	hkm_stop_recording_action();
    }
}

// This one from https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding
//function Base64Encode(data, encoding = 'utf-8') {
//    var bytes = new (TextEncoder || TextEncoderLite)(encoding).encode(data);        
//    return base64js.fromByteArray(bytes);
//

// This one from https://stackoverflow.com/a/11562550
function Base64Encode(arrayBuffer) {
    return btoa(String.fromCharCode.apply(null, new Uint8Array(arrayBuffer)));
}


function hkm_uploadbase64(data) {
    if (hkm_packetnr == 0) {
	hkm_start_base64upload(data, hkm_packetnr++);
    }
    else {
	hkm_continue_base64upload(data, hkm_packetnr++);
    } 
}



function hkm_start_base64upload(data, nr) {
    //player = SPEAKERNAME; // + "_" + document.getElementById("playername").value,
    //gender = document.getElementById("genderslider").value,
    //age = document.getElementById("ageslider").value,

    payload = {  player : hkm_speaker,
                 gameversion : "hokema_js",
                 device : navigator.userAgent,
                 dataencoding : "pcm",
                 datatype : "int16",
                 packetnr : nr,
		 clienttimestamp : hkm_get_time_with_zone(),
                 word : hkm_get_word_to_score(),
                 data :  Base64Encode(data) }

    extra_metadata = hkm_extra_metadata();
    Object.keys(extra_metadata).forEach(function(k) {
	payload[k] = extra_metadata[k];
    });
    
    hkm_socket.emit('start_upload', payload);

}

function hkm_continue_base64upload(data,nr) {
    hkm_socket.emit('continue_upload', {  authenticationtoken : 'foo',
					  packetnr : nr,
					  player : hkm_speaker,
					  data : Base64Encode(data) });
}

function hkm_finish_base64upload() {
    hkm_socket.emit('finish_upload', { authenticationtoken : 'foo',
				       player : hkm_speaker,
				       packetnr : hkm_packetnr });
}



function hkm_get_time_with_zone() {
    // From https://usefulangle.com/post/30/javascript-get-date-time-with-offset-hours-minutes
    var timezone_offset_min = new Date().getTimezoneOffset(),
	offset_hrs = parseInt(Math.abs(timezone_offset_min/60)),
	offset_min = Math.abs(timezone_offset_min%60),
	timezone_standard;
    
    if(offset_hrs < 10)
	offset_hrs = '0' + offset_hrs;
    
    if(offset_min < 10)
	offset_min = '0' + offset_min;
    
    // Add an opposite sign to the offset
    // If offset is 0, it means timezone is UTC
    if(timezone_offset_min < 0)
	timezone_standard = '+' + offset_hrs + ':' + offset_min;
    else if(timezone_offset_min > 0)
	timezone_standard = '-' + offset_hrs + ':' + offset_min;
    else if(timezone_offset_min == 0)
	timezone_standard = 'Z----';

    // Timezone difference in hours and minutes
    // String such as +5:30 or -6:00 or Z
    console.log(timezone_standard);
    return timezone_standard
}

