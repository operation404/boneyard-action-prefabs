import * as CONST from './scripts/constants.js';
import { registerSettings } from './scripts/settings.js';
import { initSocket } from './scripts/socket.js';
import { initActions, actionAPI } from './scripts/handler.js';

Hooks.once('init', () => {
    registerSettings();
    initActions();

    window.Boneyard = window.Boneyard ?? {};
    window.Boneyard.ActionPrefabs = actionAPI;
});

initSocket();
