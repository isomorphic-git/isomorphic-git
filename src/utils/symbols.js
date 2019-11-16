// This is part of an elaborate system to facilitate code-splitting / tree-shaking.
// commands/walk.js can depend on only this, and the actual Walker classes exported
// can be opaque - only having a single property (this symbol) that is not enumerable,
// and thus the constructor can be passed as an argument to walk while being "unusable"
// outside of it.
export const GitWalkBeta1Symbol = Symbol('GitWalkBeta1Symbol')
export const GitWalkBeta2Symbol = Symbol('GitWalkBeta2Symbol')
