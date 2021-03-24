import SockerServer from "./socket.js";
import Event from 'events';
import { constants } from "./contants.js";
import Controller from "./controller.js";

const eventEmitter = new Event();

const port = process.env.PORT || 9898;

const socketServer = new SockerServer({ port });
const server = await socketServer.initialize(eventEmitter);
console.log('socket server is running at', server.address().port);

const controller = new Controller({ socketServer });

eventEmitter.on(
    constants.events.NEW_USER_CONNECTED, 
    controller.onNewConnection.bind(controller)
);
