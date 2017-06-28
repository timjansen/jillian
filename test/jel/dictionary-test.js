'use strict';

const assert = require('assert');
const Dictionary = require('../../src/jel/dictionary.js');
const JEL = require('../../src/jel/jel.js');
const List = require('../../src/jel/list.js');
const Callable = require('../../src/jel/callable.js');
const jelAssert = require('./jel-assert.js');

describe('jelDictionary', function() {
  describe('constructor()', function() {
    it('creates empty dicts', function() {
      assert.deepEqual(new Dictionary().elements.size, 0); 
    });
    it('creates dicts from Maps', function() {
      assert.deepEqual(new Dictionary(new Map([])).size, 0); 
      assert.deepEqual(new Dictionary(new Map([['a', 5], ['c', 3]])).toObjectDebug(), {a: 5, c: 3}); 
    });
    it('creates dicts from other dicts', function() {
      assert.deepEqual(new Dictionary(new Dictionary(new Map([]))).size, 0); 
      assert.deepEqual(new Dictionary(new Dictionary(new Map([['a',5], ['c', 3]]))).toObjectDebug(), {a: 5, c: 3}); 
    });
    it('creates dicts from other lists', function() {
      assert.deepEqual(new Dictionary(new List(['x',5, 'y', 1])).toObjectDebug(), {x: 5, y: 1});
    });
    it('creates dicts from objects', function() {
      assert.deepEqual(new Dictionary({x: 5, y: 1}).toObjectDebug(), {x: 5, y: 1});
    });
    it('uses provided maps', function() {
      const m = new Map([['a', 5], ['c', 3]]);
      const d = new Dictionary(m, true);
      assert(d.elements === m);
      m.set('a', 10);
      assert.equal(d.get('a'), 10);
    });
  });
  
  describe('create()', function() {
    it('creates empty dicts', function() {
      jelAssert.equal(new JEL('Dictionary()').executeImmediately({Dictionary}).size, 0); 
    });
    it('creates dicts from lists', function() {
      jelAssert.equal(new JEL('Dictionary(["t", 8])').executeImmediately({Dictionary}).toObjectDebug(), {t: 8}); 
    });
  });
  
  describe('anyKey', function() {
    it('creates dicts from lists', function() {
      assert.equal(new JEL('Dictionary(["t", 8]).anyKey').executeImmediately({Dictionary}), "t"); 
    });
  });

  describe('size', function() {
    it('returns the size', function() {
      jelAssert.equal(new JEL('Dictionary(["v", 3, "b", 9]).size').executeImmediately({Dictionary}), 2); 
      jelAssert.equal(new JEL('{v: 3, d: 1}.size').executeImmediately({Dictionary}), 2); 
      jelAssert.equal(new JEL('Dictionary().size').executeImmediately({Dictionary}), 0);
    });
  });

  
  describe('map()', function() {
    it('maps', function() {
      jelAssert.equal(new JEL('Dictionary(["v", 3, "b", 9]).map((k,v)=>v+1)').executeImmediately({Dictionary}).toObjectDebug(), {v: 4, b: 10}); 
    });
  });

  describe('each()', function() {
    it('iterates', function() {
      let x = '';
      const accumulator = new Callable((k, v)=> x+=k+v );
      new JEL('Dictionary(["3", 2, "9", 10]).each(accumulator)').executeImmediately({Dictionary, accumulator});
      assert.equal(x, "32910");
    });
  });

  describe('filter()', function() {
    it('filters', function() {
      assert.deepEqual(new JEL("{a:3, c: 9, x: 12, y: 1}.filter((k,v)=>v>5)").executeImmediately().toObjectDebug(), {c: 9, x: 12});
    });
  });

  describe('reduce()', function() {
    it('reduces', function() {
      assert.equal(new JEL("{a:3, c: 9, x: 12, y: 1}.reduce((a,k,v)=>a+v, 2)").executeImmediately(), 27);
    });
  });

  describe('hasAny()', function() {
    it('finds something', function() {
      assert.strictEqual(new JEL('{a:3, b:2, c:9}.hasAny((k,x)=>x>2 && k!="a")').executeImmediately(), true); 
      assert.strictEqual(new JEL('{a:3, b:8, c:17, d:39, e:2, f:9}.hasAny((k,x)=>x>2 && k!="k")').executeImmediately(), true); 
    });
    it('finds nothing', function() {
      assert.strictEqual(new JEL('{a:3, b:2, c:9}.hasAny((k,x)=>x>5 && k=="a")').executeImmediately(), false); 
    });
  });

  describe('hasOnly()', function() {
    it('finds all', function() {
      assert.strictEqual(new JEL('{a:3, b:2, c:9}.hasOnly((k,x)=>x>1 && k!="a")').executeImmediately(), true); 
      assert.strictEqual(new JEL('{a:3, b:8, c:17, d:39, e:2, f:9}.hasOnly((k,x)=>x>1)').executeImmediately(), true); 
    });
    it('finds all', function() {
      assert.strictEqual(new JEL('{a:3, b:2, c:9}.hasOnly((k,x)=>x>5)').executeImmediately(), false); 
    });
  });

  describe('putAll()', function() {
    it('puts', function() {
      const d = new Dictionary();
      d.putAll({a: 3, b: 1});
      assert.deepEqual(d.toObjectDebug(), {a: 3, b: 1}); 
      d.putAll(['z', 5]);
      assert.deepEqual(d.toObjectDebug(), {a: 3, b: 1, z: 5}); 
      d.putAll(['a', 5]);
      assert.deepEqual(d.toObjectDebug(), {a: 5, b: 1, z: 5}); 
    });
  });

  describe('get()', function() {
    it('gets', function() {
      assert.equal(new JEL('{a: 2, b: 9}.get("b")').executeImmediately({Dictionary}), 9); 
      assert.strictEqual(new JEL('{a: 2, b: 9}.get("c")').executeImmediately({Dictionary}), undefined); 
    });
  });

  describe('has()', function() {
    it('has', function() {
      assert.equal(new JEL('{a: 2, b: 9}.has("b")').executeImmediately({Dictionary}), true); 
      assert.equal(new JEL('{a: 2, b: 9}.has("c")').executeImmediately({Dictionary}), false); 
    });
  });


  describe('set()', function() {
    it('sets', function() {
      const d = new Dictionary();
      d.set('a', 3);
      assert.deepEqual(d.toObjectDebug(), {a: 3}); 
      d.set('z', 5).set('b', 2);
      assert.deepEqual(d.toObjectDebug(), {a: 3, b: 2, z: 5}); 
      d.set('a', 5).set('b', 7);
      assert.deepEqual(d.toObjectDebug(), {a: 5, b: 7, z: 5}); 
    });
  });

  
  describe('keys()', function() {
    it('keys', function() {
      assert.deepEqual(new JEL('{}.keys').executeImmediately({Dictionary}).elements, []); 
      assert.deepEqual(new JEL('{a: 2, b: 9}.keys').executeImmediately({Dictionary}).elements, ['a', 'b']); 
    });
  });



});

