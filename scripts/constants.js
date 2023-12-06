export const MODULE = 'boneyard-action-prefabs';
export const SOCKET = `module.${MODULE}`;

export const SETTINGS = Object.freeze(
    Object.fromEntries(
        [
            'WHO_CAN_USE_ACTIONS',
        ].map((v) => [v, v])
    )
);
