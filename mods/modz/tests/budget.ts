import { test as engineTest } from 'claude-code/testing'

// Each engine test boots a session with modz and its stand-in mods; on a loaded machine (a full `modz check`, other
// sessions at work) the 5 s default trips while every test passes on a quiet one. Same budget as savvy-progress.
const TEST_BUDGET = { timeoutMs: 20_000 }
export const test = ((name: string, a: any, b?: any) =>
  b ? engineTest(name, { ...TEST_BUDGET, ...a }, b) : engineTest(name, TEST_BUDGET, a)) as unknown as typeof engineTest
