# Changelog

## 0.1.0

Initial build.

- Action Prefabs are provided to give a simplified way for users to write macros or other code that perform common actions in Foundry, such as modifying the fields of an actor or embedded documents.
- Actions can either resolve to produce a specific effect or execute other actions depending on the result of the action's resolution method, such as whether a dice roll passed a certain threshold.
- A generic set of actions are added that can be used with any system, allowing simple ways to perform actions such as comparing the fields of a document, updating those fields, making rolls, and modifying active effects.
- System specific actions can also be added for more specialized effects.
