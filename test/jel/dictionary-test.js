'use strict';

require('source-map-support').install();
const assert = require('assert');
const Dictionary = require('../../build/jel/types/Dictionary.js').default;
const JEL = require('../../build/jel/JEL.js').default;
const List = require('../../build/jel/types/List.js').default;
const FuzzyBoolean = require('../../build/jel/types/FuzzyBoolean.js').default;
const FunctionCallable = require('../../build/jel/FunctionCallable.js').default;
const Context = require('../../build/jel/Context.js').default;
const {JelAssert, JelPromise, JelConsole} = require('../jel-assert.js');

const dictContext = new Context().setAll({Dictionary, FuzzyBoolean, JelPromise});
const jelAssert = new JelAssert(dictContext);


describe('jelDictionary', function() {
  describe('constructor()', function() {
    it('creates empty dicts', function() {
      assert.equal(new Dictionary().elements.size, 0); 
    });
    it('creates dicts from Maps', function() {
      assert.equal(new Dictionary(new Map([])).size, 0); 
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
      assert.equal(d.get(dictContext, 'a'), 10);
    });
  });
  
  describe('create()', function() {
    it('creates empty dicts', function() {
      jelAssert.equal(new JEL('Dictionary()').executeImmediately(dictContext).size, 0); 
    });
    it('creates dicts from lists', function() {
      jelAssert.equal(new JEL('Dictionary(["t", 8])').executeImmediately(dictContext).toObjectDebug(), {t: 8}); 
    });
  });
  
  describe('anyKey', function() {
    it('picks a key', function() {
      assert.equal(new JEL('Dictionary(["t", 8]).anyKey').executeImmediately(dictContext), "t"); 
    });
  });

  describe('size', function() {
    it('returns the size', function() {
      jelAssert.equal('Dictionary(["v", 3, "b", 9]).size', 2); 
      jelAssert.equal('{v: 3, d: 1}.size', 2); 
      jelAssert.equal('Dictionary().size', 0);
    });
  });

  
  describe('map()', function() {
    it('maps', function() {
      jelAssert.equalPromise('Dictionary(["v", 3, "b", 9]).map((k,v)=>v+1)', new Dictionary({v: 4, b: 10})); 
      return jelAssert.equalPromise('Dictionary(["v", 3, "b", 9]).map((k,v)=>JelPromise(v+1))', new Dictionary({v: 4, b: 10})); 
    });
  });

  describe('each()', function() {
    it('iterates', function() {
      let x = '';
      const accumulator = new FunctionCallable((ctx, k, v)=> x+=k+'-'+v+',' );
      new JEL('Dictionary(["3", 2, "9", 10]).each(accumulator)').executeImmediately(new Context().setAll({Dictionary, accumulator}));
      assert.equal(x, "3-2,9-10,");
    });
    it('iterates with promises', function() {
      let x = '';
      const accumulator = new FunctionCallable((ctx, k, v)=> Promise.resolve(x+=k+'-'+v+','));
      return new JEL('Dictionary(["3", 2, "9", 10, "a", 11, "b", 22]).each(accumulator)').execute(new Context(dictContext).setAll({accumulator}))
				.then(()=>assert.equal(x, "3-2,9-10,a-11,b-22,"));
    });
  });

  describe('filter()', function() {
    it('filters', function() {
			JelPromise.resetRnd();
      jelAssert.equal("{a:3, c: 9, x: 12, y: 1}.filter((k,v)=>v>5)", new Dictionary({c: 9, x: 12}));
      return jelAssert.equalPromise("{a:3, c: 9, x: 12, y: 1}.filter((k,v)=>JelPromise.rnd(v>5))", new Dictionary({c: 9, x: 12}));
    });
  });

  describe('reduce()', function() {
    it('reduces', function() {
       jelAssert.equal("{a:3, c: 9, x: 12, y: 1}.reduce((a,k,v)=>a+v, 2)", 27);
       return jelAssert.equalPromise("{a:3, c: 9, x: 12, y: 1}.reduce((a,k,v)=>JelPromise(a+v), 2)", 27);
    });
  });

  describe('hasAny()', function() {
    it('finds something', function() {
			JelPromise.resetRnd();
      jelAssert.equal('{a:3, b:2, c:9}.hasAny((k,x)=>x>2 && k!="a")', FuzzyBoolean.TRUE); 
      jelAssert.equal('{a:3, b:8, c:17, d:39, e:2, f:9}.hasAny((k,x)=>x>2 && k!="k")', FuzzyBoolean.TRUE); 
      return jelAssert.equalPromise('{a:3, b:8, c:17, d:39, e:2, f:9}.hasAny((k,x)=>JelPromise.rnd(x>2 && k!="k"))', FuzzyBoolean.TRUE); 
    });
    it('finds nothing', function() {
      jelAssert.equal('{a:3, b:2, c:9}.hasAny((k,x)=>x>5 && k=="a")', FuzzyBoolean.FALSE); 
      return jelAssert.equalPromise('{a:3, b:2, c:9}.hasAny((k,x)=>JelPromise(x>5 && k=="a"))', FuzzyBoolean.FALSE); 
    });
  });

  describe('hasOnly()', function() {
    it('finds all', function() {
      jelAssert.equal('{a:3, b:2, c:9}.hasOnly((k,x)=>x>1 && k!="a")', FuzzyBoolean.FALSE); 
      jelAssert.equal('{a:3, b:8, c:17, d:39, e:2, f:9}.hasOnly((k,x)=>x>1)', FuzzyBoolean.TRUE); 
      jelAssert.equal('{a:3, b:2, c:9}.hasOnly((k,x)=>x>5)', FuzzyBoolean.FALSE); 
      return jelAssert.equalPromise('{a:3, b:2, c:9}.hasOnly((k,x)=>JelPromise(x>5))', FuzzyBoolean.FALSE); 
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
      assert.equal(new JEL('{a: 2, b: 9}.get("b")').executeImmediately(dictContext), 9); 
      assert.strictEqual(new JEL('{a: 2, b: 9}.get("c")').executeImmediately(dictContext), undefined); 
    });
  });

  describe('has()', function() {
    it('has', function() {
      assert.equal(new JEL('{a: 2, b: 9}.has("b")').executeImmediately(dictContext).state, 1); 
      assert.equal(new JEL('{a: 2, b: 9}.has("c")').executeImmediately(dictContext).state, 0); 
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
      assert.deepEqual(new JEL('{}.keys').executeImmediately(dictContext).elements, []); 
      assert.deepEqual(new JEL('{a: 2, b: 9}.keys').executeImmediately(dictContext).elements, ['a', 'b']); 
    });
  });



});

