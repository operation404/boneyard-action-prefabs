import { _resolveParse } from './handler.js';

export class Validate {
    static #validate(validator, vals, ...args) {
        Object.entries(vals).forEach(([varName, val]) => {
            val = Array.isArray(val) ? val : [val];
            val.forEach((i) => validator(varName, i, ...args));
        });
    }

    /**
     * @param {object} vals
     * @param {Array<*>} arr
     * @throws ${varName} invalid option.
     */
    static isInArray(vals, arr) {
        function validator(varName, val, arr) {
            if (!arr.includes(val)) throw `${varName} invalid option.`;
        }
        this.#validate(validator, vals, arr);
    }

    /**
     * @param {object} vals
     * @param {object} arr
     * @throws ${varName} invalid option.
     */
    static isObjField(vals, obj) {
        function validator(varName, val, obj) {
            if (!obj.hasOwnProperty(val)) throw `${varName} invalid option.`;
        }
        this.#validate(validator, vals, obj);
    }

    /**
     * @param {object} vals
     * @throws ${varName} must be a number.
     */
    static isNumber(vals) {
        function validator(varName, val) {
            if (Number.isNaN(val) || typeof val !== 'number') throw `${varName} must be a number.`;
        }
        this.#validate(validator, vals);
    }

    /**
     * @param {object} vals
     * @throws ${varName} must be an integer.
     */
    static isInteger(vals) {
        function validator(varName, val) {
            if (!Number.isInteger(val)) throw `${varName} must be an integer.`;
        }
        this.#validate(validator, vals);
    }

    /**
     * @param {object} vals
     * @throws ${varName} must be non-negative.
     */
    static isNotNegative(vals) {
        function validator(varName, val) {
            if (val < 0) throw `${varName} must be non-negative.`;
        }
        this.#validate(validator, vals);
    }

    /**
     * @param {object} vals
     * @param {object} cls
     * @throws ${varName} must be instance of ${cls.name}.
     */
    static isClass(vals, cls) {
        function validator(varName, val, cls) {
            if (!(val instanceof cls)) throw `${varName} must be instance of ${cls.name}.`;
        }
        this.#validate(validator, vals, cls);
    }

    /**
     * @param {object} vals
     * @throws ${varName} must be a string.
     */
    static isString(vals) {
        function validator(varName, val) {
            if (typeof val !== 'string') throw `${varName} must be a string.`;
        }
        this.#validate(validator, vals);
    }

    /**
     * @param {object} vals
     * @throws ${varName} must be a boolean.
     */
    static isBoolean(vals) {
        function validator(varName, val) {
            if (typeof val !== 'boolean') throw `${varName} must be a boolean.`;
        }
        this.#validate(validator, vals);
    }

    /**
     * @param {object} vals
     * @throws ${varName} must be non-null.
     */
    static isNotNull(vals) {
        function validator(varName, val) {
            if (val === undefined || val === null) throw `${varName} must be non-null.`;
        }
        this.#validate(validator, vals);
    }

    /**
     * @param {object} vals
     * @throws ${varName} must be an object.
     */
    static isObject(vals) {
        function validator(varName, val) {
            if (typeof val !== 'object') throw `${varName} must be an object.`;
        }
        this.#validate(validator, vals);
    }
}

/**
 * @class
 * @abstract
 * @property {string} type
 * @property {object} data
 */
export class Action {
    static options = {};
    type;
    data;

    /**
     * @abstract
     * @param {object} data
     */
    constructor(data) {
        if (this.constructor.name === 'Action') throw `Cannot instantiate abstract class.`;
        this.constructor.validateData(data);
        this.type = this.constructor.name;
        this.data = data;
    }

    /**
     * Validate the action data, throwing an error for any invalid data.
     * @abstract
     * @param {object} data
     * @throws Throws an error if any data fields have invalid types or values.
     */
    static validateData(data) {
        throw `Cannot call abstract method.`;
    }

    /**
     * Execute a single action with the provided data.
     * @abstract
     * @param {Document} document
     * @param {object} data
     */
    static resolve(document, data) {
        throw `Cannot call abstract method.`;
    }
}

/**
 * @class
 * @extends Action
 * @classdesc       Action that compares an attribute of a document to a provided
 *                  value, resolving additional actions based on the result.
 */
export class Comparison extends Action {
    static options = {
        operations: {
            // a is the attribute value, b is passed val
            '=': (a, b) => a === b,
            '!=': (a, b) => a !== b,
            '>': (a, b) => a > b,
            '<': (a, b) => a < b,
            '>=': (a, b) => a >= b,
            '<=': (a, b) => a <= b,
            'includes': (a, b) => a.includes(b),
            'in': (a, b) => b.includes(a),
            'hasKey': (a, b) => a.hasOwnProperty(b),
            'isKey': (a, b) => b.hasOwnProperty(a),
        },
    };

    /**
     * @param {object} data
     * @param {string} data.operation
     * @param {string} data.attributePath
     * @param {!*} data.value
     * @param {Action|Action[]} data.trueActions
     * @param {Action|Action[]} [data.falseActions]
     */
    constructor(data) {
        data.trueActions = Array.isArray(data.trueActions) ? data.trueActions : [data.trueActions];
        if (!data.hasOwnProperty('falseActions')) data.falseActions = [];
        else data.falseActions = Array.isArray(data.falseActions) ? data.falseActions : [data.falseActions];
        super(data);
    }

    /**
     * @param {object} data
     * @param {string} data.operation
     * @param {string} data.attributePath
     * @param {!*} data.value
     * @param {Action[]} data.trueActions
     * @param {Action[]} data.falseActions
     */
    static validateData({ operation, attributePath, value, trueActions, falseActions }) {
        Validate.isInArray({ operation }, Object.keys(this.options.operations));
        Validate.isString({ attributePath });
        Validate.isNotNull({ value });
        Validate.isClass({ trueActions, falseActions }, Action);
    }

    /**
     * @param {Document} document
     * @param {object} data
     * @param {string} data.operation
     * @param {string} data.attributePath
     * @param {!*} data.value
     * @param {Action[]} data.trueActions
     * @param {Action[]} data.falseActions
     * @throws 'attributePath' does not exist or its value is undefined.
     * @throws Attribute value and 'value' parameter not same type.
     */
    static resolve(document, { operation, attributePath, value, trueActions, falseActions }) {
        let attributeValue = document;
        attributePath.split('.').forEach((pathToken) => (attributeValue = attributeValue?.[pathToken]));
        if (attributeValue === undefined) throw `'attributePath' does not exist or its value is undefined.`;
        //if (typeof attributeValue !== typeof value) throw `Attribute value and 'value' parameter not same type.`;
        if (this.options.operations[operation](attributeValue, value)) _resolveParse(document, trueActions);
        else _resolveParse(document, falseActions);
    }
}

/**
 * @class
 * @extends Action
 * @classdesc       Action that updates a document with the provided values.
 */
export class UpdateDoc extends Action {
    static options = {
        operations: {
            replace: (val) => val,
            add: (val, orig) => orig + val,
        },
    };

    /**
     * @param {object} data
     * @param {object|object[]} data.updates
     */
    constructor(data) {
        data.updates = Array.isArray(data.updates) ? data.updates : [data.updates];
        super(data);
    }

    /**
     * @param {object} data
     * @param {object[]} data.updates
     * @param {string} data.updates[].attributePath
     * @param {string} data.updates[].method
     * @param {!*} data.updates[].value
     */
    static validateData({ updates }) {
        updates.forEach(({ attributePath, method, value }) => {
            Validate.isString({ attributePath });
            Validate.isInArray({ method }, Object.keys(this.options.operations));
            Validate.isNotNull({ value });
        });
    }

    /**
     * @param {Document} document
     * @param {object} data
     * @param {object[]} data.updates
     * @param {string} data.updates[].attributePath
     * @param {string} data.updates[].method
     * @param {!*} data.updates[].value
     * @throws 'attributePath' does not exist or its value is undefined.
     * @throws Attribute value and 'value' parameter not same type.
     */
    static resolve(document, { updates }) {
        const updateEntries = updates.map(({ attributePath, method, value }) => {
            let attributeValue = document;
            attributePath.split('.').forEach((pathToken) => (attributeValue = attributeValue?.[pathToken]));
            if (attributeValue === undefined) throw `'attributePath' does not exist or its value is undefined.`;
            if (typeof attributeValue !== typeof value) throw `Attribute value and 'value' parameter not same type.`;
            return [attributePath, this.options.operations[method](value, attributeValue)];
        });
        document.update(Object.fromEntries(updateEntries));
    }
}

/**
 * @class
 * @extends Action
 * @classdesc       Action that makes a roll and resolves additional actions
 *                  based on the result.
 */
export class Roll extends Action {
    static options = {
        operations: {
            '=': (a, b) => a === b,
            '!=': (a, b) => a !== b,
            '>': (a, b) => a > b,
            '<': (a, b) => a < b,
            '>=': (a, b) => a >= b,
            '<=': (a, b) => a <= b,
        },
    };

    /**
     * @param {object} data
     * @param {string} data.rollStr
     * @param {string} data.operation
     * @param {number} data.value
     * @param {Action|Action[]} data.trueActions
     * @param {Action|Action[]} [data.falseActions]
     * @param {boolean} [data.print]
     */
    constructor(data) {
        data.trueActions = Array.isArray(data.trueActions) ? data.trueActions : [data.trueActions];
        if (!data.hasOwnProperty('falseActions')) data.falseActions = [];
        else data.falseActions = Array.isArray(data.falseActions) ? data.falseActions : [data.falseActions];
        if (!data.hasOwnProperty('print')) data.print = false;
        super(data);
    }

    /**
     * @param {object} data
     * @param {string} data.rollStr
     * @param {string} data.operation
     * @param {number} data.value
     * @param {Action[]} data.trueActions
     * @param {Action[]} data.falseActions
     * @param {boolean} data.print
     */
    static validateData({ rollStr, operation, value, trueActions, falseActions, print }) {
        Validate.isString({ rollStr });
        Validate.isInArray({ operation }, Object.keys(this.options.operations));
        Validate.isNumber({ value });
        Validate.isClass({ trueActions, falseActions }, Action);
        Validate.isBoolean({ print });
    }

    static async evaluateRoll(document, { rollStr, operation, value, print }) {
        const roll = await new Roll(rollStr, document?.getRollData()).roll();
        if (print) roll.toMessage();
        return this.options.operations[operation](roll.total, value);
    }

    static async resolve(document, data) {
        await _resolveParse(document, (await this.evaluateRoll(document, data)) ? data.trueActions : data.falseActions);
    }
}

/**
 * @class
 * @extends Action
 * @classdesc       Action that applies an active effect to an actor document.
 */
export class ActiveEffect extends Action {
    static options = {
        operations: {
            apply: async (actor, { effectData, print }) => {
                const updateEffects = [];
                const createEffects = effectData.filter((e) => {
                    const effect = actor.effects.find((f) => this.compareEffects(e, f));
                    if (effect) updateEffects.push({ _id: effect.id, ...e });
                    else return true;
                });
                await actor.updateEmbeddedDocuments('ActiveEffect', updateEffects);
                await actor.createEmbeddedDocuments('ActiveEffect', createEffects);
                // TODO print
            },
            remove: async (actor, { effectData, print }) => {
                const effectsToRemove = [];
                effectData.forEach((e) => {
                    const effect = actor.effects.find((f) => f.label === e.label);
                    if (effect) effectsToRemove.push(effect.id);
                });
                await actor.deleteEmbeddedDocuments('ActiveEffect', effectsToRemove);
                // TODO print
            },
            toggle: async () => {},
        },
    };

    static compareEffects(ef1, ef2) {
        const name = ef1.name === ef2.name;
        const len = ef1.statuses.length === ef2.statuses.length;
        const status = ef1.statuses.every((v) => ef2.statuses.includes(v));
        return name && len && status;
    }

    /**
     * @param {object} data
     * @param {string} data.operation
     * @param {object|object[]} data.effectData
     * @param {boolean} [data.print]
     */
    constructor(data) {
        data.effectData = Array.isArray(data.effectData) ? data.effectData : [data.effectData];
        if (!data.hasOwnProperty('print')) data.print = false;
        super(data);
    }

    /**
     * @param {object} data
     * @param {string} data.operation
     * @param {object[]} data.effectData
     * @param {boolean} data.print
     */
    static validateData({ operation, effectData, print }) {
        Validate.isInArray({ operation }, Object.keys(this.options.operations));
        Validate.isObject({ effectData });
        Validate.isBoolean({ print });
        this.validateEffectData(effectData);
    }

    static validateEffectData(effectData) {
        try {
            const docClass = CONFIG.ActiveEffect.documentClass;
            effectData.forEach((d) => new docClass(foundry.utils.deepClone(d)));
        } catch (e) {
            console.error('Invalid ActiveEffect data.');
            console.error(e.message);
            console.error(e);
        }
    }

    static async resolve(actor, data) {
        await this.options.operations[data.operation](actor, data);
    }
}

/**
 * @class
 * @extends Action
 * @classdesc       Action that applies a system status effect to an actor document.
 */
export class StatusEffect extends ActiveEffect {
    static options = {
        statusEffects: CONFIG.statusEffects.map((e) => e.id),
    };

    /**
     * @param {object} data
     * @param {string} data.operation
     * @param {string|string[]} data.statuses
     * @param {boolean} [data.print]
     */
    constructor(data) {
        data.statuses = Array.isArray(data.statuses) ? data.statuses : [data.statuses];
        const { operation, statuses, print } = data;
        const effectData = statuses.map((status) => {
            const statusData = foundry.utils.deepClone(CONFIG.statusEffects.find((s) => s.id === status));
            statusData.statuses = [statusData.id];
            delete statusData.id;
            statusData.name = game.i18n.localize(statusData.name);
            return statusData;
        });
        super({ operation, effectData, print: print ?? false });
    }

    static validateData(data) {
        super.validateData.bind(Object.getPrototypeOf(this))(data);
    }

    static resolve(actor, data) {
        super.resolve.bind(Object.getPrototypeOf(this))(actor, data);
    }
}

export const actions = [Comparison, UpdateDoc, Roll, ActiveEffect, StatusEffect];
