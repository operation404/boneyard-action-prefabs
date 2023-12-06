See my other modules in the [Boneyard Collection](https://github.com/operation404/boneyard-collection).

# Boneyard Action Prefabs

Boneyard Action Prefabs adds an API for generating and executing Actions, small packages of code that can automate common actions in FoundryVTT. They are intended to be used for simplifying the process of writing custom macros for your game, and require minimal coding knowledge to take advantage of.

Further documentation and examples can be found in the repository [wiki](https://github.com/operation404/boneyard-action-prefabs/wiki).

```js
/*
  Example macro using some of the Generic and DnD5e Action Prefabs.
*/
const actor = canvas.tokens.documentCollection.contents[0].actor;
const actions = Boneyard.ActionPrefabs;
const { SavingThrow, Damage, Comparison, StatusEffect } = actions.types;

// Apply the 'dead' status effect
const a_deadStatus = actions.create(StatusEffect, {
    operation: 'apply',
    statuses: 'dead',
    print: true,
});

// Check if hp is <= 0, if true then resolve a_deadStatus
const a_0Hp = actions.create(Comparison, {
    attributePath: 'system.attributes.hp.value',
    operation: '<=',
    value: 0,
    trueActions: a_deadStatus,
});

// Apply 15 fire damage
const a_someDamage = actions.create(Damage, {
    value: 15,
    damageType: 'fire',
    print: true,
});

// Make a dexterity save, on a fail resolve a_someDamage followed by a_0Hp
const a_makeSave = actions.create(SavingThrow, {
    type: 'dex',
    dc: 10,
    falseActions: [a_someDamage, a_0Hp],
    print: true,
});

// Resolve the a_makeSave action on the 'actor' ActorDocument
actions.resolve(actor, a_makeSave);
```
