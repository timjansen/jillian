'use strict';

require('source-map-support').install();
const assert = require('assert');
const DefaultContext = require('../../build/jel/DefaultContext.js').default;
const JEL = require('../../build/jel/JEL.js').default;
const JelString = require('../../build/jel/types/JelString.js').default;
const List = require('../../build/jel/types/List.js').default;
const JelBoolean = require('../../build/jel/types/JelBoolean.js').default;
const Dictionary = require('../../build/jel/types/Dictionary.js').default;
const FunctionCallable = require('../../build/jel/FunctionCallable.js').default;
const Context = require('../../build/jel/Context.js').default;
const {plus, JelAssert, JelPromise, JelConsole} = require('../jel-assert.js');

const jelAssert = new JelAssert();


describe('jelDictionary', function() {
  let defaultContext, ctx;
  before(function(){
    return DefaultContext.get().then(dc=> {
      return plus(dc).then(c=> {
        ctx = c;
        jelAssert.setCtx(ctx);
      });    
    });
  });
  
  describe('constructor()', function() {
    it('creates empty dicts', function() {
      assert.equal(new Dictionary().elements.size, 0); 
      assert.equal(Dictionary.clazz.name, "Dictionary"); 
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
      assert.deepEqual(new Dictionary(new List([JelString.valueOf('x'),5, JelString.valueOf('y'), 1])).toObjectDebug(), {x: 5, y: 1});
    });
    it('creates dicts from objects', function() {
      assert.deepEqual(new Dictionary({x: 5, y: 1}).toObjectDebug(), {x: 5, y: 1});
    });
    it('uses provided maps', function() {
      const m = new Map([['a', 5], ['c', 3]]);
      const d = new Dictionary(m, true);
      assert(d.elements === m);
      m.set('a', 10);
      assert.equal(d.get(ctx, 'a'), 10);
    });
  });
  
  describe('creation', function() {
    it('creates empty dicts', function() {
      jelAssert.equal(new JEL('{}').executeImmediately(ctx).size, 0); 
    });
    it('creates dicts from lists', function() {
      jelAssert.equal(new JEL('{"t": 8}').executeImmediately(ctx).toObjectDebug(), {t: 8}); 
      jelAssert.equal(new JEL('{"t": 8}').executeImmediately(ctx).clazz.className, "Class"); 
    });
  });
  
  describe('anyKey', function() {
    it('picks a key', function() {
      jelAssert.equal(new JEL('{"t": 8}.anyKey').executeImmediately(ctx), "'t'"); 
    });
  });
  
  
  describe('access', function() {
    it('allows access by string or as member', function() {
      jelAssert.equal(new JEL('{"t": 8}["t"]').executeImmediately(ctx), "8"); 
      jelAssert.equal(new JEL('{"t": 8}.t').executeImmediately(ctx), "8"); 
    });
  });

  describe('size', function() {
    it('returns the size', function() {
      jelAssert.equal('{v: 3, "b": 9}.size', 2); 
      jelAssert.equal('{v: 3, d: 1}.size', 2); 
      jelAssert.equal('Dictionary.empty.size', 0);
    });
  });

  
  describe('map()', function() {
    it('maps', function() {
      jelAssert.equalPromise('{"v": 3, "b": 9}.map((k,v)=>v+1)', new Dictionary({v: 4, b: 10})); 
      return jelAssert.equalPromise('{"v": 3, "b": 9}.map((k,v)=>JelPromise(v+1))', new Dictionary({v: 4, b: 10})); 
    });
  });

  describe('each()', function() {
    it('iterates', function() {
      let x = '';
      const accumulator = new FunctionCallable((ctx, k, v)=> x+=k+'-'+v+',' );
      new JEL('{"3": 2, "9": 10}.each(accumulator)').executeImmediately(new Context().setAll({accumulator}));
      assert.equal(x, "3-2,9-10,");
    });
    it('iterates with promises', function() {
      let x = '';
      const accumulator = new FunctionCallable((ctx, k, v)=> Promise.resolve(x+=k+'-'+v+','));
      return new JEL('{"3": 2, "9": 10, "a": 11, "b": 22}.each(accumulator)').execute(new Context(ctx).setAll({accumulator}))
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
      jelAssert.equal('{a:3, b:2, c:9}.hasAny((k,x)=>x>2 && k!="a")', JelBoolean.TRUE); 
      jelAssert.equal('{a:3, b:8, c:17, d:39, e:2, f:9}.hasAny((k,x)=>x>2 && k!="k")', JelBoolean.TRUE); 
      return jelAssert.equalPromise('{a:3, b:8, c:17, d:39, e:2, f:9}.hasAny((k,x)=>JelPromise.rnd(x>2 && k!="k"))', JelBoolean.TRUE); 
    });
    it('finds nothing', function() {
      jelAssert.equal('{a:3, b:2, c:9}.hasAny((k,x)=>x>5 && k=="a")', JelBoolean.FALSE); 
      return jelAssert.equalPromise('{a:3, b:2, c:9}.hasAny((k,x)=>JelPromise(x>5 && k=="a"))', JelBoolean.FALSE); 
    });
  });

  describe('hasOnly()', function() {
    it('finds all', function() {
      jelAssert.equal('{a:3, b:2, c:9}.hasOnly((k,x)=>x>1 && k!="a")', JelBoolean.FALSE); 
      jelAssert.equal('{a:3, b:8, c:17, d:39, e:2, f:9}.hasOnly((k,x)=>x>1)', JelBoolean.TRUE); 
      jelAssert.equal('{a:3, b:2, c:9}.hasOnly((k,x)=>x>5)', JelBoolean.FALSE); 
      return jelAssert.equalPromise('{a:3, b:2, c:9}.hasOnly((k,x)=>JelPromise(x>5))', JelBoolean.FALSE); 
    });
  });

  describe('putAll()', function() {
    it('puts', function() {
      const d = new Dictionary();
      d.putAll({a: 3, b: 1});
      assert.deepEqual(d.toObjectDebug(), {a: 3, b: 1}); 
      d.putAll([JelString.valueOf('z'), 5]);
      assert.deepEqual(d.toObjectDebug(), {a: 3, b: 1, z: 5}); 
      d.putAll([JelString.valueOf('a'), 5]);
      assert.deepEqual(d.toObjectDebug(), {a: 5, b: 1, z: 5}); 
    });
  });

  describe('get()', function() {
    it('gets', function() {
      jelAssert.equal('{a: 2, b: 9}.get("b")', "9"); 
      jelAssert.equal('{a: 2, b: 9}.get("c")', "null"); 
    });
  });

  describe('has()', function() {
    it('has', function() {
      assert.equal(new JEL('{a: 2, b: 9}.has("b")').executeImmediately(ctx).state, 1); 
      assert.equal(new JEL('{a: 2, b: 9}.has("c")').executeImmediately(ctx).state, 0); 
    });
  });

  describe('set()', function() {
    it('sets', function() {
      const d = new Dictionary();
      const d2 = d.set(ctx, 'a', 3);
      assert.deepEqual(d2.toObjectDebug(), {a: 3}); 
      const d3 = d2.set(ctx, 'z', 5).set(ctx, 'b', 2);
      assert.deepEqual(d3.toObjectDebug(), {a: 3, b: 2, z: 5}); 
      const d4 = d3.set(ctx, 'a', 5).set(ctx, 'b', 7);
      assert.deepEqual(d4.toObjectDebug(), {a: 5, b: 7, z: 5}); 
    });
  });

  describe('setAll()', function() {
    it('sets', function() {
      jelAssert.equal("{a: 2, b: 5}.setAll({b: 6, c: 5})", "{a: 2, b: 6, c: 5}");
      jelAssert.equal("{a: 2, b: 5} + {b: 6, c: 5}", "{a: 2, b: 6, c: 5}");
    });
  });

  describe('delete()', function() {
    it('deletes', function() {
      jelAssert.equal("{a: 2, b: 5}.delete('b')", "{a: 2}");
      jelAssert.equal("{a: 2, b: 5}.delete('c')", "{a: 2, b: 5}");
    });
  });
  
  describe('deleteAll()', function() {
    it('deletes', function() {
      jelAssert.equal("{a: 2, b: 5}.deleteAll({b: 6, c: 5})", "{a: 2}");
      jelAssert.equal("{a: 2, b: 5} - {b: 6, c: 5}", "{a: 2}");
      jelAssert.equal("{a: 2, b: 5}.deleteAll(['b', 'c'])", "{a: 2}");
    });
  });

  
  
  
  describe('keys', function() {
    it('keys', function() {
      assert.deepEqual(new JEL('{}.keys').executeImmediately(ctx).elements, []); 
      assert.deepEqual(new JEL('{a: 2, b: 9}.keys').executeImmediately(ctx).elements, ['a', 'b']); 
    });
  });

  describe('isEmpty', function() {
    it('checks for emptyness', function() {
      jelAssert.equal('{}.isEmpty', 'true'); 
      jelAssert.equal('{a: 2, b: 9}.isEmpty', 'false'); 
    });
  });



});

