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

osc.on('*', message => {
    console.log('got', message);
});

osc.open(); // start a WebSocket server on port 8080

setInterval(function() {
    osc.send(new OSC.Message('/hi/v'));
}, 4000);

console.log('started');
