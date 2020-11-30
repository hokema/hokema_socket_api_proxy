# hokema_socket_api_proxy


### Get started ### 

 1. Edit `env.local` along the lines of `env.local.template`. You'll need to ask us for an authorisation token and Hokema's server addresses. 
 
 2. Use nginx, apache or similar as an SSL endpoint and route unencrypted http & websocket traffic to port 8012.

 3. Run `docker-compose up --build -d hokema_speech_socket_proxy`

To help you build your application, use the javascripts in `public/js/` as a base.

A barebones Express application is included in this repo and will be displayed on `$MYBASEPATH/` unless you specify `NODE_ENV=production` in the `env.local` file.

### Hokema Socket.io API ###

Connect to the Socket.io server (let's call it `socket` from now on).

Authorise the connection:

```
socket.emit('auth', {token : AUTHTOKEN });
```

You have to know the speaker and target utterance. When the speaker is ready to speak, start streaming data packets to the server with a `start_upload` event:

```
socket.emit('start_upload', { player : String,
                              gameversion : String,
                              device : String,
                              dataencoding : "pcm",
                              datatype : "int16",
                              packetnr : 0,
                              clienttimestamp : Datestring,
                              word : String,
                              data :  String(Base64Encoded data),
                            });
```

And continue the stream with `continue_upload` events (send more packets as data is recorded):

```
socket.emit('continue_upload', { player : String,
                                 packetnr : int,
                                 word : String,
                                 data :  String(Base64Encoded data),
                                });
```

And when the speaker is done, send a `finish_upload` event (that can contain the last audio packet if you like):

```
socket.emit('finish_upload', { player : String,
                               packetnr : int,
                               word : String,
                               data :  String(Base64Encoded data),
                              });
```

The socket will return events:

`whoareyou` Authentication is needed, please try sending the authorisation credentials again.

`recogniser_ready` Server is ready to receive speech.

`recogniser_down`  Something bad happend and recogniser can't receive speech just now.

`score` A positive score means successful recognition, zero means no word is detected, negative score is en error code:

* `-11` Timeout: Processing took longer than 2 s and was aborted.
* `-13` Recognition error: Something real bad happened and recogniser needs to be restarted.
* A positive score means a successful recognition and analysis and returns the score a bunch of metadata like gender and age guesses and very experimental error analytics:

```
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
```



### Using the JS library ###


Everything is neatly packed into `hokema_socketio_speech.js`. Using the script requires overriding the actions in  `hokema_default_actions.js`.


#### Define upload preparation functions: #### 

`hkm_get_word_to_score()` Returns the word or utterance that is to be scored.

`hkm_get_speaker_id()` Returns the id of the current speaker.


#### Define UI actions: ####

`hkm_start_recording_action()` UI actions when starting recording and uploading.

`hkm_stop_recording_action()` UI actions when stopping recording and uploading.

`hkm_score_display_action(data, callback)` UI actions when score is received.

`hkm_disconnect_action()` UI action when connection is disconnected.

`hkm_connected_action()` UI action when connection is established.

`hkm_ready_to_recognise_action()` UI action when recogniser is ready.

`hkm_recogniser_down_action()` UI action when recogniser is not ready.


#### And when everything is set, start (and stop) upload: ####

`hkm_start_recording()` Start! Will grab the utterance and spkeaker id, resume the microphone audio stream, apply anti-alias filter, downsample to 16k, base64 encode packets and start uploading packets through the Socket.io connection.

`hkm_stop_recording()` Stop! Will stop the microphone stream and all assorted activity.


