const OSC = require('osc-js')

const config = {
    udpClient: { port: 3000 },
    udpServer: { port: 3001 },
    wsServer: { port: 8888 },
    receiver: 'udp'
}
const osc = new OSC({ plugin: new OSC.BridgePlugin(config) })

osc.on('error', message => {
    console.log('error', message);
});

// osc.on('*', message => {
//     console.log('got', message);
// });

osc.open();

setInterval(function() {
    osc.send(new OSC.Message('/hi/v'));
}, 4000);


var finalhandler = require('finalhandler')
var http = require('http')
var serveStatic = require('serve-static')

// Serve up public/ftp folder
var serve = serveStatic('dist/midi', { index: ['index.html'] })

// Create server
var server = http.createServer(function onRequest (req, res) {
  serve(req, res, finalhandler(req, res))
})

// Listen
server.listen(4201)

console.log('started');


