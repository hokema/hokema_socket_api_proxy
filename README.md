# hokema_socket_api_proxy


### Get started ### 

 1. Edit `env.local` along the lines of `env.local.template`. You'll need to ask us for an authorisation token and Hokema's server addresses. 
 
 2. Use nginx, apache or similar as an SSL endpoint and route unencrypted http & websocket traffic to port 8012.

 3. Run `docker-compose up --build -d hokema_speech_socket_proxy`

To help you build your application, use the javascripts in `public/js/` as a base.

A barebones Express application is included in this repo and will be displayed on `$MYBASEPATH/` unless you specify `NODE_ENV=production` in the `env.local` file.

### Hokema Socket.io API ###


Authorising connection:

```
hkm_socket.emit('auth', {token : AUTHTOKEN });
```

Starting upload:
```
hkm_socket.emit('start_upload', { player : String,
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

Continue upload (send packets as data is recorded)

```
hkm_socket.emit('continue_upload', { player : String,
                                     packetnr : int,
                                     word : String,
                                     data :  String(Base64Encoded data),
                                   });
```

Finish upload:

```
hkm_socket.emit('finish_upload', { player : String,
                                   packetnr : int,
                                   word : String,
                                   data :  String(Base64Encoded data),
                                 });
```


### Using the JS library ###



