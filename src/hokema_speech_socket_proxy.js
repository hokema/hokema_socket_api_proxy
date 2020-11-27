

const express = require('express');
var http=require('http');
var path=require('path');

if (process.env.GEOIPTOKEN) {
    var geoip = require('geoip-lite');
}

/* These events come from the client */
downstreamevents = [ 'are_you_ok',
		     'connect_error',
		     'connect_timeout',
		     'continue_upload',
		     'disconnect',
		     'finish_upload',
		     'level_complete',
		     'loggable_event',
		     'playing_sample',
		     'reconnect',
		     'start_game',
		     'start_level',
		     'start_upload' ];

/* These events come from the speech processing server */
upstreamevents = [ 'recogniser_down',
		   'recogniser_ready',
		   'roger',
		   'score',
		   'welcome_back' ];


var us_players = {}

var io_client = require("socket.io-client");


/**
 * Start Express server.
 */


const app = module.exports = express();


/**
 * Express configuration.
 */
app.set('host', process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0');
app.set('port', process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8012);
app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "pug");
app.use(express.static(path.join(__dirname, "../public")));

// In production mode there's a blank page waiting for visitors:
if (process.env.NODE_ENV == "production") {
    app.get("/", (req, res) => {
	res.sendStatus(200);
    });
}
// If were not in production mode, here's a test page for
// trying the connection:
else {
    app.get("/", (req, res) => {
	res.render("index", { title: "Hokema Speech Proxy",
			      baseURL : process.env.MYBASEPATH,
			      socketURL : process.env.MYSOCKETPATH,			      
			    });
    });
}


var server = http.createServer(app);

server.listen(app.get('port'), () => {
    console.log('Upstream socket is at %s%s', process.env.HOKEMASOCKETHOST,  process.env.HOKEMASOCKETPATH); 
    console.log('App is running at http://localhost:%d in %s mode', app.get('port'), app.get('env'));
    console.log('  Press CTRL-C to stop\n');
});



var io_server = require('socket.io')(server, {
    path: process.env.MYSOCKETPATH
});

// Keep track of number of connections:
var open_connections = 0;
var update_connection_count = function(change) {
    open_connections += change;
    console.log( new Date().toISOString() + " connection count " + open_connections );
}


io_server.on('connection', function(downstreamsocket) {

    // Do you need to authorise the connection? The query params are
    // available in downstreamsocket.handshake.query and so maybe you 
    // have downstreamsocket.handshake.query.auth.username and
    // downstreamsocket.handshake.query.auth.password and you want to
    // validate them. Or some kind of access token. Do it here now if
    // you need authentication:
    // if (downstreamsocket.handshake.query.auth.username != 'här' ||
    //     downstreamsocket.handshake.query.auth.password != 'vilar') {
    //     downstreamsocket.disconnect();
    // }

    
    var clientcountry = '?';
    // If running in Docker, the user's IP is probably in the proxy headers 
    var my_ip = downstreamsocket.handshake.headers['x-forwarded-for'] || downstreamsocket.request.connection.remoteAddress;
    
    if (process.env.GEOIPTOKEN) {
	// You can use geoip information to choose the right privacy
	// regulations in the user's country!
	
	var geo = geoip.lookup(my_ip);
	
	if (geo == null) {
	    geo = { 'country' : '??', 'city' : '???' }
	}
	
	console.log( new Date().toISOString() + " new connection from "+my_ip + " " + geo.country + " "  + geo.city );
	clientcountry = geo.country;
    }
    else {
	console.log( new Date().toISOString() + " new connection from "+my_ip);
    }
    
    update_connection_count(1);

    // Open a new upstream connection for the downstream client.
    // Why? Because of load balancing, players are assigned to different
    // computing nodes in Hokema's speech processing cluster.
    //
    // Transport protocol must be 'websocket' unless you want to fetch a cookie
    // from the load balancer first.
    var upstreamsocket = io_client(process.env.HOKEMASOCKETHOST, {
	path: process.env.HOKEMASOCKETPATH,
	transports: ['websocket'],
	upgrade: false,
	reconnectionDelayMax: 1000,
	    query: {
		auth: { 'token' :  process.env.HOKEMASERVICETOKEN  }
	    },
    });

    // If upstream socket disconnects, disconnect the downstream socket
    upstreamsocket.on('disconnect', function() {
	downstreamsocket.disconnect();
    });

    // ... and vice versa:
    downstreamsocket.on('disconnect', function() {
	update_connection_count(-1);
	upstreamsocket.disconnect();
    });

    // If upstream wants to know who is asking for access;
    // Respond with authentication token:
    upstreamsocket.on('whoareyou', function() {
	upstreamsocket.emit('auth', { 'token' :  process.env.HOKEMASERVICETOKEN  });
    });
    
    // Any other events beside authentication are routed
    // between the upstream and the downstream:
    upstreamevents.forEach(function(ev) {
	upstreamsocket.on(ev, function(data) {
	    downstreamsocket.emit(ev, data);	    
	})
    });

    // ...and between the downstream and the upstream:
    downstreamevents.forEach(function(ev) {
	downstreamsocket.on(ev, function(data) {
	    upstreamsocket.emit(ev, data);
	})
    });

});
