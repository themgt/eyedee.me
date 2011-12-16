#!/usr/bin/env node

// require libraries that we depend on
const
express = require('express'),
postprocess = require('postprocess'),
url = require('url'),
path = require('path');

// the key with which session cookies are encrypted
const COOKIE_SECRET = process.env.SEKRET || 'you love, i love, we all love beer!';

// The IP Address to listen on.
const IP_ADDRESS = process.env.IP_ADDRESS || '127.0.0.1';

// The port to listen to.
const PORT = process.env.PORT || 0;

// localHostname is the address to which we bind.  It will be used
// as our external address ('audience' to which assertions will be set)
// if no 'Host' header is present on incoming login requests.
var localHostname = undefined;

// create a webserver using the express framework
var app = express.createServer();

// do some logging
app.use(express.logger({ format: 'dev' }));

// parse cookies
app.use(express.cookieParser());

// parse post bodies
app.use(express.bodyParser());

// The next three functions contain some fancy logic to make it so
// we can run multiple different versions of myfavoritebeer on the
// same server, each which uses a different browserid server
// (dev/beta/prod):
function determineEnvironment(req) {
  if (req.headers['host'] === 'eyedee.me') return 'prod';
  else if (req.headers['host'] === 'beta.eyedee.me') return 'beta';
  else if (req.headers['host'] === 'dev.eyedee.me') return 'dev';
  else return 'local';
}

function determineBrowserIDURL(req) {
  // first defer to the environment
  if (process.env.BROWSERID_URL) return process.env.BROWSERID_URL;

  return ({
    prod:   'https://browserid.org',
    beta:   'https://diresworb.org',
    dev:    'https://dev.diresworb.org',
    local:  'https://dev.diresworb.org'
  })[determineEnvironment(req)];
}

function determineBrowserIDHost(req) {
  return determineBrowserIDURL(req).replace(/http(s?):\/\//, '');
}

// a substitution middleware allows us to easily point at different browserid servers
app.use(postprocess.middleware(function(req, body) {
  var browseridURL = determineBrowserIDURL(req);
  return body.toString().replace(new RegExp("https://browserid.org", 'g'), browseridURL);
}));


// Tell express from where it should serve static resources
app.use(express.static(path.join(path.dirname(__dirname), "static")));

// start listening for connections
app.listen(PORT, IP_ADDRESS, function () {
  var address = app.address();
  localHostname = address.address + ':' + address.port
  console.log("listening on " + localHostname);
});
