'use strict';

const assert = require('assert');
const JEL = require('../../src/jel/jel.js');
const List = require('../../src/jel/list.js');
const Callable = require('../../src/jel/callable.js');
const jelAssert = require('./jel-assert.js');

describe('jelList', function() {
  describe('constructor()', function() {
    it('creates empty lists', function() {
      assert.deepEqual(new List().elements, []); 
    });
    it('creates lists from arrays', function() {
      assert.deepEqual(new List([]).elements, []); 
      assert.deepEqual(new List([1,5]).elements, [1,5]); 
    });
    it('creates lists from array-like objects', function() {
      assert.deepEqual(new List({length: 0}).elements, []); 
      assert.deepEqual(new List({length: 2, 0:1, 1:5}).elements, [1,5]); 
    });
    it('creates lists from other lists', function() {
      assert.deepEqual(new List(new List([1,5])).elements, [1,5]); 
    });
  });
  
  describe('create()', function() {
    it('creates empty lists', function() {
      jelAssert.equal(new JEL('List()').execute({List}), new List()); 
    });
    it('creates lists from other lists', function() {
      jelAssert.equal(new JEL('List(List([1,8]))').execute({List}), new List([1,8])); 
    });
    it('is equivalent to the built-in lists', function() {
      jelAssert.equal(new JEL('[4, 2, 1]').execute({List}), new List([4, 2, 1])); 
    });
  });
  
  describe('first', function() {
    it('returns the first', function() {
      jelAssert.equal(new JEL('[3, 2, 9].first').execute(), 3); 
    });
    it('returns undefined if list empty', function() {
      jelAssert.equal(new JEL('[].first').execute(), undefined); 
    });
  });

  describe('last', function() {
    it('returns the last', function() {
      jelAssert.equal(new JEL('[3, 2, 9].last').execute(), 9); 
    });
    it('returns undefined if list empty', function() {
      jelAssert.equal(new JEL('[].last').execute(), undefined); 
    });
  });

  describe('length', function() {
    it('returns the length', function() {
      jelAssert.equal(new JEL('[1, 3, 2, 9].length').execute(), 4); 
      jelAssert.equal(new JEL('[].length').execute(), 0);
    });
  });

  
  describe('map()', function() {
    it('maps', function() {
      jelAssert.equal(new JEL('[3, 2, 9].map((a,i)=>a+i)').execute(), new List([3, 3, 11])); 
    });
  });

  describe('each()', function() {
    it('iterates', function() {
      let x = 0;
      const accumulator = new Callable((a, i)=>x+=a+2*i);
      new JEL('[3, 2, 9].each(accumulator)').execute({accumulator});
      assert.equal(x, 20);
    });
  });

  describe('reduce()', function() {
    it('reduces', function() {
      jelAssert.equal(new JEL('[3, 2, 9].reduce((ak,a,i)=>ak+a+2*i, 2)').execute(), 22); 
    });
  });

  describe('hasAny()', function() {
    it('finds something', function() {
      assert.strictEqual(new JEL('[3, 2, 9].hasAny((x,i)=>x>2 && i>0)').execute(), true); 
      assert.strictEqual(new JEL('[3, 8, 17, 39, 2, 9].hasAny((x,i)=>x>2 && i>0)').execute(), true); 
    });
    it('finds nothing', function() {
      assert.strictEqual(new JEL('[3, 2, 9].hasAny((x,i)=>x>5 && i<1)').execute(), false); 
    });
  });

  describe('hasOnly()', function() {
    it('finds all', function() {
      assert.strictEqual(new JEL('[3, 2, 9].hasOnly(x=>x>1)').execute(), true); 
      assert.strictEqual(new JEL('[3, 2, 9].hasOnly((x,i)=>i<10)').execute(), true); 
    });
    it('finds nothing', function() {
      assert.strictEqual(new JEL('[3, 8, 17, 39, 2, 9].hasOnly(x=>x>2)').execute(), false); 
      assert.strictEqual(new JEL('[3, 2, 9].hasOnly(x=>x<9)').execute(), false); 
      assert.strictEqual(new JEL('[3, 2, 9].hasOnly(x=>x<0)').execute(), false);
      assert.strictEqual(new JEL('[3, 2, 9, 4, 2, 2, 5, 6].hasOnly((x,i)=>i<7)').execute(), false); 
    });
  });

});

