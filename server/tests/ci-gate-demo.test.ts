import { describe, expect, it } from 'vitest';

/**
 * TEMPORARY FILE - Lab 5, check C-02 (R-06).
 *
 * This test exists only to prove that a failing required check blocks a merge.
 * It is never meant to be merged: it lives on the throw-away branch
 * `lab5/c02-failing-check`, the pull request is closed without merging, and the
 * branch is deleted afterwards. The released application is never touched.
 *
 * Delete this file and the rule it demonstrates disappears - which is exactly
 * why the screenshot must also show the active ruleset.
 */
describe('Lab 5 C-02 demonstration', () => {
  it('fails on purpose so the required check blocks the merge', () => {
    expect(true).toBe(false);
  });
});
