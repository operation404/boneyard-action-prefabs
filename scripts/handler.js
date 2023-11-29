import * as CONST from '../constants.js';
import { socket, registerSocketFunc } from '../socket.js';
import { actions as genericActions, Action } from './generic.js';
import * as WWN from './systems/wwn.js';
import * as DND5E from './systems/dnd5e.js';

const actionMap = {};
export const actionAPI = {
    options: {},
    types: {},
    resolve: resolveActions,
    /**
     * @param {string} type
     * @param {object} data
     * @returns {Action}
     */
    create: (type, data) => {
        const action = actionMap[type];
        if (!action) throw `Invalid Action type.`;
        return new action(data);
    },
    /**
     * @param {Action} action
     */
    register: (action) => {
        actionMap[action.name] = action;
        actionAPI.types[action.name] = action.name;
        actionAPI.options[action.name] = Object.fromEntries(
            Object.entries(action.options).map(([key, val]) => [key, Array.isArray(val) ? val : Object.keys(val)])
        );
    },
};

export function initActions() {
    registerSocketFunc(resolveActions);

    // Register all generic actions and system specific actions if the current
    // system is one that's supported.
    const systems = [DND5E, WWN];
    [
        ...genericActions,
        ...(Object.fromEntries(systems.map((s) => [s.systemId, s.actions]))[game.system.id] ?? []),
    ].forEach((action) => actionAPI.register(action));
}

/**
 * @param {Document|string} document    A document or the UUID of a document.
 * @param {Action|Action[]} actions     The actions to perform on the document.
 */
async function resolveActions(document, actions) {
    if (typeof document === 'string') {
        document = await fromUuid(document);
        if (document === undefined) throw `Invalid Document UUID.`;
    }

    if (game.user.isGM) {
        await _resolveParse(document, actions);
    } else {
        if (game.settings.get(CONST.MODULE, CONST.SETTINGS.PLAYERS_CAN_USE_ACTIONS)) {
            socket.executeAsGM(resolveActions.name, document.uuid, actions);
        } else throw `Setting allowing players to use Preset Actions is false.`;
    }
}

/**
 * @param {Document|string} document    A document or the UUID of a document.
 * @param {Action|Action[]} actions     The actions to perform on the document.
 */
export async function _resolveParse(document, actions) {
    for (const { type, data } of Array.isArray(actions) ? actions : [actions]) {
        await actionMap[type].resolve(document, data);
    }
}
