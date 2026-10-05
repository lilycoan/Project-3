import { test } from 'node:test';
import assert from 'node:assert/strict';
import { categoryFor } from '../js/recommend.js';

test('categoryFor uses the feels-like high bands at each edge', () => {
  assert.equal(categoryFor(85), 'hot');
  assert.equal(categoryFor(84.9), 'warm');
  assert.equal(categoryFor(70), 'warm');
  assert.equal(categoryFor(69.9), 'mild');
  assert.equal(categoryFor(55), 'mild');
  assert.equal(categoryFor(54.9), 'cold');
  assert.equal(categoryFor(null), null);
});
