'use strict';

const Util = require('../../src/util/util.js');
const assert = require('assert');

describe('util', function() {
  describe('isArrayLike()', function() {
    it('works', function() {
      assert.equal(Util.isArrayLike([]), true);
      assert.equal(Util.isArrayLike([null, undefined]), true);
      assert.equal(Util.isArrayLike([[]]), true);
      assert.equal(Util.isArrayLike({0:1, length: 1}), true);
      assert.equal(Util.isArrayLike("test"), false);
      assert.equal(Util.isArrayLike(2), false);
      assert.equal(Util.isArrayLike({0: 1}), false);
    });
  });

  
  describe('flattenToArray()', function() {
    it('works', function() {
      assert.deepEqual(Util.flattenToArray([]), []);
      assert.deepEqual(Util.flattenToArray([null, undefined]), []);
      assert.deepEqual(Util.flattenToArray([[]]), []);
      assert.deepEqual(Util.flattenToArray([[],[]]), []);
      assert.deepEqual(Util.flattenToArray([null, [], [undefined], [[null]], [[[]]]]), []);
      assert.deepEqual(Util.flattenToArray([1, 2, 3]), [1, 2, 3]);
      assert.deepEqual(Util.flattenToArray([[1, 2], 3]), [1, 2, 3]);
      assert.deepEqual(Util.flattenToArray([[[[[1]]], [2, 3]]]), [1, 2, 3]);
    });
  });

  describe('addRecursively()', function() {
    it('works', function() {
      assert.deepEqual(Util.addRecursively(1, []), [1]);
      assert.deepEqual(Util.addRecursively(1, [0]), [0, 1]);
      assert.deepEqual(Util.addRecursively(null, [0]), [0]);
      assert.deepEqual(Util.addRecursively([2, null, 3], [0]), [0, 2, 3]);
      assert.deepEqual(Util.addRecursively([[2], null, [], [3, [], 4]], [0]), [0, 2, 3, 4]);
    });
  });

});

