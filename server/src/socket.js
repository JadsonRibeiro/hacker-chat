import http from 'http';
import { v4 } from 'uuid';
import { constants } from './contants.js'

export default class SockerServer {
    constructor({ port }) {
        this.port =  port;
    }

    async sendMessage(socket, event, message) {
        const data = JSON.stringify({ event, message });

        // \n serve para separar as mensagens recebidas caso várias
        // cheguem ao mesmo tempo
        socket.write(`${data}\n`);
    }

    async initialize(eventEmitter) {
        const server = http.createServer((req, res) => {
            res.writeHead(200, { 'Content-Type': 'text/plan' });
            res.end('hey there!');
        });

        server.on('upgrade', (req, socket) => {
            socket.id = v4();
            const headers = [
                'HTTP/1.1 101 Web Socket Protocol Handshake',
                'Upgrade: WebSocket',
                'Connection: Upgrade',
                ''
            ].map(line => line.concat('\r\n')).join('');
            socket.write(headers);
            eventEmitter.emit(constants.events.NEW_USER_CONNECTED, socket);
        });

        return new Promise((resolve, reject) => {
            server.on('error', reject);
            server.listen(this.port, () => resolve(server));
        });
    }
}