import { Validate, Action, Comparison, Roll } from '../generic.js';
import { _resolveParse } from '../handler.js';

export const systemId = 'dnd5e';

/**
 * @class
 * @extends Action
 * @classdesc       Applies damage to the actor using the 5e `applyDamage` method.
 *                  Attempts to account for the actor's damage resistances, immunities,
 *                  and vulnerabilities.
 */
class Damage extends Action {
    static options = {
        get damageTypes() {
            return Object.keys(CONFIG.DND5E.damageTypes);
        },
    };

    /**
     * @param {object} data
     * @param {string} data.damageType
     * @param {number} data.value
     * @param {boolean} [data.print]
     */
    constructor(data) {
        if (!data.hasOwnProperty('print')) data.print = false;
        super(data);
    }

    /**
     * @param {object} data
     * @param {string} data.damageType
     * @param {number} data.value
     * @param {boolean} data.print
     */
    static validateData({ damageType, value, print }) {
        Validate.isInArray({ damageType }, this.options.damageTypes);
        Validate.isInteger({ value });
        Validate.isBoolean({ print });
    }

    /**
     * Determine the damage type's multiplier for the actor.
     * @param {ActorDocument} actor
     * @param {string} damageType
     */
    static getMultiplier(actor, damageType) {
        const { di: damageImmunities, dr: damageResistances, dv: damageVulnerabilities } = actor.system.traits;
        if (damageResistances.value.has(damageType)) {
            return 0.5;
        } else if (damageImmunities.value.has(damageType)) {
            return 0;
        } else if (damageVulnerabilities.value.has(damageType)) {
            return 2;
        }
        return 1;
    }

    /**
     * @param {ActorDocument} actor
     * @param {number} value
     * @param {string} damageType
     */
    static async print(actor, value, damageType) {
        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `<span>${actor.name} takes ${value} ${CONFIG.DND5E.damageTypes[damageType]} damage.</span><br>`,
        });
    }

    /**
     * Apply damage or healing to the actor, accounting for immunities, resistances,
     * and vulnerabilities.
     * @param {ActorDocument} actor
     * @param {object} data
     * @param {string} data.damageType
     * @param {number} data.value
     * @param {boolean} data.print
     */
    static async resolve(actor, { damageType, value, print }) {
        const multiplier = this.getMultiplier(actor, damageType);
        await actor.applyDamage(value, multiplier);
        if (print) await this.print(actor, value, damageType);
    }
}

/**
 * @class
 * @extends Damage
 * @classdesc       Applies healing to the actor using the 5e `applyDamage` method.
 */
class Healing extends Damage {
    /**
     * @param {object} data
     * @param {number} data.value
     * @param {boolean} [data.print]
     */
    constructor(data) {
        super(data);
    }

    /**
     * @param {object} data
     * @param {number} data.value
     * @param {boolean} data.print
     * @throws 'value' must be integer.
     * @throws 'print' must be boolean.
     */
    static validateData({ value, print }) {
        Validate.isInteger({ value });
        Validate.isBoolean({ print });
    }

    /**
     * @param {ActorDocument} actor
     * @param {number} value
     */
    static async print(actor, value) {
        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `<span>${actor.name} heals ${value} hp.</span><br>`,
        });
    }

    /** @override */
    static getMultiplier() {
        return -1;
    }
}

/**
 * @class
 * @abstract
 * @extends Roll
 * @classdesc       Resolves a roll using the 5e roll methods. Must be extended
 *                  to implement a specific roll type.
 */
class Roll5E extends Roll {
    static options = {};

    // https://github.com/foundryvtt/dnd5e/blob/master/module/dice/dice.mjs

    /**
     * @param {object} data
     * @param {string} data.type
     * @param {number} [data.bonus]
     * @param {number} data.dc
     * @param {Action|Action[]} [data.trueActions]
     * @param {Action|Action[]} [data.falseActions]
     * @param {boolean} [data.print]
     */
    constructor(data) {
        if (!data.hasOwnProperty('bonus')) data.bonus = 0;
        super(data);
    }

    /**
     * @param {object} data
     * @param {string} data.type
     * @param {number} data.bonus
     * @param {number} data.dc
     * @param {Action[]} data.trueActions
     * @param {Action[]} data.falseActions
     * @param {boolean} data.print
     */
    static validateData({ bonus, dc, trueActions, falseActions, print }) {
        Validate.isInteger({ bonus, dc });
        Validate.isClass({ trueActions, falseActions }, Action);
        Validate.isBoolean({ print });
    }

    /**
     * @abstract
     */
    static getRollType() {
        throw `Cannot call abstract method.`;
    }

    static async evaluateRoll(actor, { type, bonus, dc, print }) {
        const rollType = this.getRollType();
        const roll = await actor[rollType](type, {
            fastForward: true,
            targetValue: dc,
            parts: ['@bonus'],
            data: { bonus },
            critical: null,
            fumble: null,
            chatMessage: print,
            messageData: {
                speaker: ChatMessage.getSpeaker({ actor }),
            },
        });
        return roll.total >= dc;
    }
}

/**
 * @class
 * @extends Roll5E
 * @classdesc       Makes a Saving Throw using the 5e `rollAbilitySave` method and
 *                  resolves subactions based on the result.
 */
class SavingThrow extends Roll5E {
    static options = {
        get type() {
            return Object.keys(CONFIG.DND5E.abilities);
        },
    };

    /**
     * @param {object} data
     * @param {string} data.type
     * @param {number} data.bonus
     * @param {number} data.dc
     * @param {Action[]} data.trueActions
     * @param {Action[]} data.falseActions
     * @param {boolean} data.print
     */
    static validateData(data) {
        const { type } = data;
        Validate.isInArray({ type }, this.options.type);
        super.validateData(data);
    }

    static getRollType() {
        return 'rollAbilitySave';
    }
}

/**
 * @class
 * @extends Roll5E
 * @classdesc       Makes an Ability Check using the 5e `rollAbilityTest` method and
 *                  resolves subactions based on the result.
 */
class AbilityCheck extends Roll5E {
    static options = {
        get type() {
            return Object.keys(CONFIG.DND5E.abilities);
        },
    };

    /**
     * @param {object} data
     * @param {string} data.type
     * @param {number} data.bonus
     * @param {number} data.dc
     * @param {Action[]} data.trueActions
     * @param {Action[]} data.falseActions
     * @param {boolean} data.print
     */
    static validateData(data) {
        const { type } = data;
        Validate.isInArray({ type }, this.options.type);
        super.validateData(data);
    }

    static getRollType() {
        return 'rollAbilityTest';
    }
}

/**
 * @class
 * @extends Roll5E
 * @classdesc       Makes a Skill Check using the 5e `rollSkill` method and
 *                  resolves subactions based on the result.
 */
class SkillCheck extends Roll5E {
    static options = {
        get type() {
            return Object.keys(CONFIG.DND5E.skills);
        },
    };

    /**
     * @param {object} data
     * @param {string} data.type
     * @param {number} data.bonus
     * @param {number} data.dc
     * @param {Action[]} data.trueActions
     * @param {Action[]} data.falseActions
     * @param {boolean} data.print
     */
    static validateData(data) {
        const { type } = data;
        Validate.isInArray({ type }, this.options.type);
        super.validateData(data);
    }

    static getRollType() {
        return 'rollSkill';
    }
}

/**
 * @class
 * @extends Comparison
 * @classdesc       Resolves subactions based on the actor's creature type.
 */
class CreatureType extends Comparison {
    static options = {
        get creatureTypes() {
            return Object.keys(CONFIG.DND5E.creatureTypes);
        },
    };

    /**
     * @param {object} data
     * @param {string|string[]} data.type
     * @param {Action|Action[]} [data.trueActions]
     * @param {Action|Action[]} [data.falseActions]
     */
    constructor({ type, trueActions, falseActions }) {
        const data = {
            operation: 'in',
            attributePath: 'system.details.type.value',
            value: Array.isArray(type) ? type : [type],
        };
        if (trueActions) data.trueActions = trueActions;
        if (falseActions) data.falseActions = falseActions;
        super(data);
    }

    static validateData(data) {
        const { value } = data;
        Validate.isObjField({ value }, this.options.creatureTypes);
        super.validateData.bind(Object.getPrototypeOf(this))(data);
    }

    static async resolve(actor, data) {
        if (actor.type === 'npc') await super.resolve.bind(Object.getPrototypeOf(this))(actor, data);
    }
}

export const actions = [Damage, Healing, SavingThrow, AbilityCheck, SkillCheck, CreatureType];
