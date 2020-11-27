

var hkm_start_recording_action = function() {
    document.getElementById("startupload").disabled = true;
    document.getElementById("endupload").disabled = false;
    console.log("Started recording");
}

var hkm_stop_recording_action = function(score_callback) {
    document.getElementById("endupload").disabled = true;
    console.log("Stopped recording");
}

var hkm_score_display_action = function(data, callback) {
    document.getElementById("startupload").disabled = false;

    console.log("Result from server");
    console.log(data);
    
    document.getElementById("results").innerHTML=JSON.stringify(data, undefined, 2);
}

var hkm_get_word_to_score = function() {
    return document.getElementById("word_or_phrase").value;
}

var hkm_get_speaker_id  = function() {
    return document.getElementById("speaker_id").value;
}

var hkm_disconnect_action = function(reason) {
    document.getElementById("startupload").disabled = true;
    document.getElementById("results").innerHTML="Server disconnected.";
}

var hkm_connected_action = function() {
    document.getElementById("startupload").disabled = true;
    document.getElementById("results").innerHTML="Connected, waiting for recogniser. (Did you authenticate correctly?)";
}

var hkm_ready_to_recognise_action = function() {
    console.log("Recogniser ready");
    document.getElementById("startupload").disabled = false;
    document.getElementById("results").innerHTML="Recogniser ready.";
}

var hkm_recogniser_down_action = function() {
    console.log("Recogniser down");
    document.getElementById("startupload").disabled = true;
    document.getElementById("results").innerHTML="Recogniser down.";
}

var hkm_extra_metadata = function() {
    return { gameversion : "hokema socket demo" }
}
