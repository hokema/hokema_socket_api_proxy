# hokema_socket_api_proxy


### Get started ### 

 1. Edit `env.local` along the lines of `env.local.template`. You'll need to ask us for an authorisation token and Hokema's server addresses. 
 
 2. Use nginx, apache or similar as an SSL endpoint and route unencrypted http & websocket traffic to port 8012.

 3. Run `docker-compose up --build -d hokema_speech_socket_proxy`

To help you build your application, use the javascripts in `public/js/` as a base.

A barebones Express application is included in this repo and will be displayed on `$MYBASEPATH/` unless you specify `NODE_ENV=production` in the `env.local` file.

### Hokema Socket.io API ###

[Here will be the description of events between the server and proxy/client]
