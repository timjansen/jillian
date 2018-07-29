'use strict';

require('source-map-support').install();
const assert = require('assert');
const JEL = require('../../build/jel/JEL.js').default;
const JelType = require('../../build/jel/JelType.js').default;
const List = require('../../build/jel/types/List.js').default;
const Context = require('../../build/jel/Context.js').default;
const FunctionCallable = require('../../build/jel/FunctionCallable.js').default;
const {JelAssert, JelPromise, JelConsole} = require('../jel-assert.js');
const jelAssert = new JelAssert();

const ctx = new Context().setAll({List});

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
      jelAssert.equal(new JEL('List()').executeImmediately(ctx), new List()); 
    });
    it('creates lists from other lists', function() {
      jelAssert.equal(new JEL('List(List([1,8]))').executeImmediately(ctx), new List([1,8])); 
    });
    it('is equivalent to the built-in lists', function() {
      jelAssert.equal(new JEL('[4, 2, 1]').executeImmediately(ctx), new List([4, 2, 1])); 
    });
  });
  
  describe('first', function() {
    it('returns the first', function() {
      jelAssert.equal(new JEL('[3, 2, 9].first').executeImmediately(), 3); 
    });
    it('returns undefined if list empty', function() {
      jelAssert.equal(new JEL('[].first').executeImmediately(), undefined); 
    });
  });

  describe('last', function() {
    it('returns the last', function() {
      jelAssert.equal(new JEL('[3, 2, 9].last').executeImmediately(), 9); 
    });
    it('returns undefined if list empty', function() {
      jelAssert.equal(new JEL('[].last').executeImmediately(), undefined); 
    });
  });

  describe('length', function() {
    it('returns the length', function() {
      jelAssert.equal(new JEL('[1, 3, 2, 9].length').executeImmediately(), 4); 
      jelAssert.equal(new JEL('[].length').executeImmediately(), 0);
    });
  });

  
  describe('map()', function() {
    it('maps', function() {
      jelAssert.equal(new JEL('[3, 2, 9].map((a,i)=>a+i)').executeImmediately(), new List([3, 3, 11])); 
    });
  });

  describe('each()', function() {
    it('iterates', function() {
      let x = 0;
      const accumulator = new FunctionCallable((a, i)=>x+=a+2*i);
      new JEL('[3, 2, 9].each(accumulator)').executeImmediately(new Context().setAll({accumulator}));
      assert.equal(x, 20);
    });
  });

  describe('reduce()', function() {
    it('reduces', function() {
      jelAssert.equal(new JEL('[3, 2, 9].reduce((ak,a,i)=>ak+a+2*i, 2)').executeImmediately(), 22); 
    });
  });

  describe('hasAny()', function() {
    it('finds something', function() {
      assert.strictEqual(new JEL('[3, 2, 9].hasAny((x,i)=>x>2 && i>0)').executeImmediately(), true); 
      assert.strictEqual(new JEL('[3, 8, 17, 39, 2, 9].hasAny((x,i)=>x>2 && i>0)').executeImmediately(), true); 
    });
    it('finds nothing', function() {
      assert.strictEqual(new JEL('[3, 2, 9].hasAny((x,i)=>x>5 && i<1)').executeImmediately(), false); 
    });
  });

  describe('hasOnly()', function() {
    it('finds all', function() {
      assert.strictEqual(new JEL('[3, 2, 9].hasOnly(x=>x>1)').executeImmediately(), true); 
      assert.strictEqual(new JEL('[3, 2, 9].hasOnly((x,i)=>i<10)').executeImmediately(), true); 
    });
    it('finds nothing', function() {
      assert.strictEqual(new JEL('[3, 8, 17, 39, 2, 9].hasOnly(x=>x>2)').executeImmediately(), false); 
      assert.strictEqual(new JEL('[3, 2, 9].hasOnly(x=>x<9)').executeImmediately(), false); 
      assert.strictEqual(new JEL('[3, 2, 9].hasOnly(x=>x<0)').executeImmediately(), false);
      assert.strictEqual(new JEL('[3, 2, 9, 4, 2, 2, 5, 6].hasOnly((x,i)=>i<7)').executeImmediately(), false); 
    });
  });

  
  describe('bestMatch()', function() {
    it('handles small lists', function() {
      assert.deepEqual(new JEL('[].bestMatches((a,b)=>a>b)').executeImmediately().elements, []); 
      assert.deepEqual(new JEL('[1].bestMatches((a,b)=>a>b)').executeImmediately().elements, [1]); 
    });
    it('matches single elements', function() {
      assert.deepEqual(new JEL('[3, 2, 9, 5].bestMatches((a,b)=>a>b)').executeImmediately().elements, [9]); 
      assert.deepEqual(new JEL('[9, 2, 3, 5].bestMatches((a,b)=>a>b)').executeImmediately().elements, [9]); 
      assert.deepEqual(new JEL('[1, 3, 3, 5, 9].bestMatches((a,b)=>a>b)').executeImmediately().elements, [9]); 
      assert.deepEqual(new JEL('[9, 2, 3, 5].bestMatches((a,b)=>a<b)').executeImmediately().elements, [2]); 
      assert.deepEqual(new JEL("['foo', 'bar', 'blabla', 'blablabla'].bestMatches((a,b)=>a.length>b.length)").executeImmediately().elements, ['blablabla']); 
    });
    it('matches multiple elements', function() {
      assert.deepEqual(new JEL('[3, 2, 9, 5, 9].bestMatches((a,b)=>a>b)').executeImmediately().elements, [9, 9]); 
      assert.deepEqual(new JEL('[9, 2, 3, 5, 9, 9].bestMatches((a,b)=>a>b)').executeImmediately().elements, [9, 9, 9]); 
      assert.deepEqual(new JEL('[3, 9, 3, 9, 5].bestMatches((a,b)=>a>b)').executeImmediately().elements, [9, 9]); 
      assert.deepEqual(new JEL('[9, 2, 2, 3, 5].bestMatches((a,b)=>a<b)').executeImmediately().elements, [2, 2]); 
      assert.deepEqual(new JEL("['foo', 'bar', 'blabla', 'blablabla'].bestMatches((a,b)=>a.length<b.length)").executeImmediately().elements, ['foo', 'bar']); 
    });
  });

  describe('sort()', function() {
    it('handles small lists', function() {
      assert.deepEqual(new JEL('[].sort()').executeImmediately().elements, []); 
      assert.deepEqual(new JEL('[1].sort()').executeImmediately().elements, [1]); 
      assert.deepEqual(new JEL('[].sort((a,b)=>a>b)').executeImmediately().elements, []); 
      assert.deepEqual(new JEL('[1].sort((a,b)=>a>b)').executeImmediately().elements, [1]); 
    });
    it('sorts by default sorter', function() {
      assert.deepEqual(new JEL('[3, 2, 9, 5].sort()').executeImmediately().elements, [2, 3, 5, 9]); 
      assert.deepEqual(new JEL('[9, 2, 3, 5].sort()').executeImmediately().elements, [2, 3, 5, 9]); 
      assert.deepEqual(new JEL('[1, 3, 3, 5, 9, 9].sort()').executeImmediately().elements, [1, 3, 3, 5, 9, 9]); 
    });
    it('sorts by lambda', function() {
      assert.deepEqual(new JEL('[3, 2, 9, 5].sort((a,b)=>a<b)').executeImmediately().elements, [2, 3, 5, 9]); 
      assert.deepEqual(new JEL('[9, 2, 3, 5].sort((a,b)=>a<b)').executeImmediately().elements, [2, 3, 5, 9]); 
      assert.deepEqual(new JEL('[1, 3, 3, 5, 9, 9].sort((a,b)=>a<b)').executeImmediately().elements, [1, 3, 3, 5, 9, 9]); 
      assert.deepEqual(new JEL("['foo', 'blabla', 'bar', 'blablabla'].sort((a,b)=>a.length>b.length)").executeImmediately().elements, ['blablabla', 'blabla', 'foo', 'bar']); 
    });
    it('sorts by string key', function() {
      class X extends JelType {
     	  constructor(x) {
					super();
				  this.a = x;
			  }
        static create(x) {
          return new X(x);
        }
      }
      X.create_jel_mapping = {x:0};
      X.prototype.JEL_PROPERTIES = {a:1};
			
			const ctx = new Context().setAll({X});

			assert.deepEqual(new JEL('[X(17), X(3), X(11), X(9)].sort(key="a").map(o=>o.a)').executeImmediately(ctx).elements, [3, 9, 11, 17]); 
      assert.deepEqual(new JEL('[X(17), X(3), X(11), X(9)].sort(isLess=(a,b)=>a<b, key="a").map(o=>o.a)').executeImmediately(ctx).elements, [3, 9, 11, 17]); 
    });
    it('sorts by key function', function() {
      assert.deepEqual(new JEL('[{a: 17}, {a: 3}, {a: 11}, {a: 9}].sort(key=o=>o.get("a")).map(o=>o.get("a"))').executeImmediately().elements, [3, 9, 11, 17]); 
      assert.deepEqual(new JEL('[{a: 17}, {a: 3}, {a: 11}, {a: 9}].sort((a,b)=>a<b, key=o=>o.get("a")).map(o=>o.get("a"))').executeImmediately().elements, [3, 9, 11, 17]); 
      assert.deepEqual(new JEL('[{a: "xxxx"}, {a: "xx"}, {a: "x"}, {a: "xxxxxx"}].sort(isLess=(a,b)=>a.length<b.length, key=o=>o.get("a")).map(o=>o.get("a"))').executeImmediately().elements, 
											 ["x", "xx", "xxxx", "xxxxxx"]); 
    });
  });
	
	
  describe('min()/max()', function() {
    it('handles small lists', function() {
      assert.deepEqual(new JEL('[].min()').executeImmediately(), undefined); 
      assert.deepEqual(new JEL('[].max()').executeImmediately(), undefined); 
      assert.deepEqual(new JEL('[1].min()').executeImmediately(), 1); 
      assert.deepEqual(new JEL('[1].max()').executeImmediately(), 1); 
      assert.deepEqual(new JEL('[].min((a,b)=>a>b)').executeImmediately(), undefined); 
      assert.deepEqual(new JEL('[1].max((a,b)=>a>b)').executeImmediately(), 1); 
    });
    it('find by default sorter', function() {
      assert.deepEqual(new JEL('[3, 2, 9, 5].min()').executeImmediately(), 2); 
      assert.deepEqual(new JEL('[3, 2, 9, 5].max()').executeImmediately(), 9); 
      assert.deepEqual(new JEL('[1, 3, 3, 5, 9, 9].max()').executeImmediately(), 9); 
    });
    it('find by lambda', function() {
      assert.deepEqual(new JEL('[3, 2, 9, 5].max((a,b)=>a<b)').executeImmediately(), 9); 
      assert.deepEqual(new JEL('[9, 2, 3, 5].min((a,b)=>a<b)').executeImmediately(), 2);
      assert.deepEqual(new JEL("['foo', 'blabla', 'bar', 'blablabla'].min((a,b)=>a.length<b.length)").executeImmediately(), 'foo'); 
      assert.deepEqual(new JEL("['foo', 'blabla', 'bar', 'blablabla'].max((a,b)=>a.length<b.length)").executeImmediately(), 'blablabla'); 
    });
    it('finds by string key', function() {
      class X extends JelType {
     	  constructor(x) {
					super();
				  this.a = x;
			  }
        static create(x) {
          return new X(x);
        }
      }
      X.create_jel_mapping = {x:0};
      X.prototype.JEL_PROPERTIES = {a:1};
			
			const ctx = new Context().setAll({X});

			assert.deepEqual(new JEL('[X(17), X(3), X(11), X(9)].min(key="a").a').executeImmediately(ctx), 3); 
			assert.deepEqual(new JEL('[X(17), X(3), X(11), X(9)].max(key="a").a').executeImmediately(ctx), 17); 
      assert.deepEqual(new JEL('[X(17), X(3), X(11), X(9)].min(isLess=(a,b)=>a<b, key="a").a').executeImmediately(ctx), 3); 
      assert.deepEqual(new JEL('[X(17), X(3), X(11), X(9)].max(isLess=(a,b)=>a<b, key="a").a').executeImmediately(ctx), 17); 
    });
    it('find by key function', function() {
      assert.deepEqual(new JEL('[{a: 17}, {a: 3}, {a: 11}, {a: 9}].min(key=o=>o.get("a")).get("a")').executeImmediately(), 3); 
      assert.deepEqual(new JEL('[{a: 17}, {a: 3}, {a: 11}, {a: 9}].max(key=o=>o.get("a")).get("a")').executeImmediately(), 17); 
      assert.deepEqual(new JEL('[{a: 17}, {a: 3}, {a: 11}, {a: 9}].min((a,b)=>a<b, key=o=>o.get("a")).get("a")').executeImmediately(), 3); 
      assert.deepEqual(new JEL('[{a: 17}, {a: 3}, {a: 11}, {a: 9}].max((a,b)=>a<b, key=o=>o.get("a")).get("a")').executeImmediately(), 17); 
      assert.deepEqual(new JEL('[{a: "xxxx"}, {a: "xx"}, {a: "x"}, {a: "xxxxxx"}].min(isLess=(a,b)=>a.length<b.length, key=o=>o.get("a")).get("a")').executeImmediately(), "x"); 
      assert.deepEqual(new JEL('[{a: "xxxx"}, {a: "xx"}, {a: "x"}, {a: "xxxxxx"}].max(isLess=(a,b)=>a.length<b.length, key=o=>o.get("a")).get("a")').executeImmediately(), "xxxxxx"); 
    });
  });

  describe('sub()', function() {
    it('handles small lists', function() {
      assert.deepEqual(new JEL('[].sub(0, 100)').executeImmediately().elements, []); 
      assert.deepEqual(new JEL('[].sub(-2, 5)').executeImmediately().elements, []); 
      assert.deepEqual(new JEL('[].sub(0)').executeImmediately().elements, []); 
      assert.deepEqual(new JEL('[1].sub(0,100)').executeImmediately().elements, [1]); 
      assert.deepEqual(new JEL('[1].sub(-1,5)').executeImmediately().elements, [1]); 
      assert.deepEqual(new JEL('[1].sub(-1)').executeImmediately().elements, [1]); 
      assert.deepEqual(new JEL('[1].sub(0, 0)').executeImmediately().elements, []); 
    });
    it('allows flexible params', function() {
      assert.deepEqual(new JEL('[3, 2, 9, 5].sub(0, 5)').executeImmediately().elements, [3, 2, 9, 5]); 
      assert.deepEqual(new JEL('[9, 2, 3, 5].sub(0)').executeImmediately().elements, [9, 2, 3, 5]); 
      assert.deepEqual(new JEL('[1, 3, 3, 5, 9, 9].sub(-3, 100)').executeImmediately().elements, [5, 9, 9]); 
      assert.deepEqual(new JEL('[1, 3, 3, 5, 9, 9].sub(-3, -2)').executeImmediately().elements, [5]); 
      assert.deepEqual(new JEL('[1, 3, 3, 5, 9, 9].sub(-3, -100)').executeImmediately().elements, []); 
      assert.deepEqual(new JEL("['foo', 'blabla', 'bar', 'blablabla'].sub()").executeImmediately().elements, ['foo', 'blabla', 'bar', 'blablabla']); 
    });
    it('creates smaller lists', function() {
      assert.deepEqual(new JEL('[3, 2, 9, 5].sub(1)').executeImmediately().elements, [2, 9, 5]); 
      assert.deepEqual(new JEL('[3, 2, 9, 5].sub(2)').executeImmediately().elements, [9, 5]); 
      assert.deepEqual(new JEL('[3, 2, 9, 5].sub(-2)').executeImmediately().elements, [9, 5]); 
      assert.deepEqual(new JEL('[3, 2, 9, 5].sub(1, 2)').executeImmediately().elements, [2]); 
      assert.deepEqual(new JEL('[3, 2, 9, 5].sub(1, 3)').executeImmediately().elements, [2, 9]); 
      assert.deepEqual(new JEL('[9, 2, 3, 5].sub(-3, -1)').executeImmediately().elements, [2, 3]); 
      assert.deepEqual(new JEL('[1, 3, 3, 5, 9, 9].sub()').executeImmediately().elements, [1, 3, 3, 5, 9, 9]); 
      assert.deepEqual(new JEL("['foo', 'blabla', 'bar', 'blablabla'].sub(2, -1)").executeImmediately().elements, ['bar']); 
    });
  });

});

