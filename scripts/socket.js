import * as CONST from './constants.js';

/*
TODO is it worth handling sockets myself for more practice?
Or just keep using socketlib for simplicity sake
*/
export let socket;

const socketReady = `${CONST.MODULE}.socketReady`;

export function initSocket() {
    Hooks.once('socketlib.ready', () => {
        socket = socketlib.registerModule(CONST.MODULE);
        Hooks.callAll(socketReady);
    });
}

export function registerSocketFunc(func) {
    const register = () => socket.register(func.name, func);
    if (socket) register();
    else Hooks.once(socketReady, register);
}
