import { constants } from './contants.js';

export default class Controller {
    #users = new Map();
    #rooms = new Map();

    constructor({ socketServer }) {
        this.socketServer = socketServer;
    }

    onNewConnection(socket) {
        const { id } = socket;
        console.log('connection stablished with', id);
        const userData = { id, socket };
        this.#updateGlobalUserData(id, userData);

        socket.on('data', this.#onSocketData(id));
        socket.on('error', this.#onSocketClosed(id));
        socket.on('end', this.#onSocketClosed(id));
    }

    async joinRoom(socketId, data) {
        const userData = data;
        console.log(`${userData.userName} joined!`);
        const user = this.#updateGlobalUserData(socketId, userData);
        const { roomId } = userData;
        const users = this.#joinUserOnRoom(roomId, user);

        const currentUsers = Array.from(users.values()).map(({ id, userName}) => ({ userName, id }));

        // Atualiza o usuário corrente sobre todos os usuários 
        // que já estão conectados na mesma sala
        this.socketServer.sendMessage(user.socket, constants.events.UPDATE_USERS, currentUsers);

        this.broadCast({
            socketId,
            roomId,
            message: { id: socketId, userName: userData.userName },
            event: constants.events.NEW_USER_CONNECTED
        })
    }

    broadCast({ socketId, roomId, event, message, includeCurrentSocket = false }) {
        const usersOnRoom = this.#rooms.get(roomId);

        for (const [key, user] of usersOnRoom) {
            if(!includeCurrentSocket && key === socketId) continue;

            this.socketServer.sendMessage(user.socket, event, message);
        }
    }

    #joinUserOnRoom(roomId, user) {
        const usersOnRoom = this.#rooms.get(roomId) ?? new Map();
        usersOnRoom.set(user.id, user);
        this.#rooms.set(roomId, usersOnRoom);

        return usersOnRoom;
    }

    #onSocketData(id) {
        return data => {
            try {
                const { event, message } = JSON.parse(data);
    
                // event terá o mesmo no das funções da classe
                this[event](id, message);
            } catch (error) {
                console.log('wrong event format', data.toString());
            }
        }
    }

    #onSocketClosed(id) {
        return data => {
            console.log('onSocketClosed', id);
        }
    }

    #updateGlobalUserData(socketID, userData) {
        const users = this.#users;
        const user = users.get(socketID) ?? {};

        const updatedUserData = {
            ...user,
            ...userData
        };

        users.set(socketID, updatedUserData);

        return users.get(socketID);
    }
}