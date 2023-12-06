import * as CONST from './constants.js';

export function registerSettings() {
    game.settings.register(CONST.MODULE, CONST.SETTINGS.WHO_CAN_USE_ACTIONS, {
        name: `SETTINGS.NAME.${CONST.SETTINGS.WHO_CAN_USE_ACTIONS}`,
        hint: `SETTINGS.HINT.${CONST.SETTINGS.WHO_CAN_USE_ACTIONS}`,
        scope: 'world',
        config: true,
        type: String,
        default: true,
        choices: {
            1: `SETTINGS.CHOICES.${CONST.SETTINGS.WHO_CAN_USE_ACTIONS}.ALL`,
            2: `SETTINGS.CHOICES.${CONST.SETTINGS.WHO_CAN_USE_ACTIONS}.TRUSTED`,
            3: `SETTINGS.CHOICES.${CONST.SETTINGS.WHO_CAN_USE_ACTIONS}.GM`,
        },
    });
}
