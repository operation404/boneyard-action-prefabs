import * as CONST from './constants.js';

export function registerSettings() {
    game.settings.register(CONST.MODULE, CONST.SETTINGS.PLAYERS_CAN_USE_ACTIONS, {
        name: `SETTINGS.NAME.${CONST.SETTINGS.PLAYERS_CAN_USE_ACTIONS}`,
        hint: `SETTINGS.HINT.${CONST.SETTINGS.PLAYERS_CAN_USE_ACTIONS}`,
        scope: 'world',
        config: true,
        type: Boolean,
        default: true,
    });
}
