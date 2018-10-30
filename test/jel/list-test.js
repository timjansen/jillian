'use strict';

require('source-map-support').install();
const assert = require('assert');
const Context = require('../../build/jel/Context.js').default;
const DefaultContext = require('../../build/jel/DefaultContext.js').default;
const JEL = require('../../build/jel/JEL.js').default;
const JelObject = require('../../build/jel/JelObject.js').default;
const List = require('../../build/jel/types/List.js').default;
const JelString = require('../../build/jel/types/JelString.js').default;
const JelNumber = require('../../build/jel/types/JelNumber.js').default;
const JelBoolean = require('../../build/jel/types/JelBoolean.js').default;
const ApproximateNumber = require('../../build/jel/types/ApproximateNumber.js').default;
const FunctionCallable = require('../../build/jel/FunctionCallable.js').default;
const {JelAssert, JelPromise, JelConsole} = require('../jel-assert.js');
const jelAssert = new JelAssert();

const ctx = DefaultContext.plus({JelPromise, JelConsole});
jelAssert.setCtx(ctx);

describe('jelList', function() {
  describe('constructor()', function() {
    it('creates empty lists', function() {
      assert.deepEqual(new List().elements, []); 
    });
    it('creates lists from arrays', function() {
      assert.deepEqual(new List([]).elements, []); 
      assert.deepEqual(new List([1,5].map(JelNumber.valueOf)).elements, [1,5].map(JelNumber.valueOf)); 
    });
    it('creates lists from array-like objects', function() {
      assert.deepEqual(new List({length: 0}).elements, []); 
      assert.deepEqual(new List({length: 2, 0:JelNumber.valueOf(1), 1:JelNumber.valueOf(5)}).elements, [1,5].map(JelNumber.valueOf)); 
    });
    it('creates lists from other lists', function() {
      assert.deepEqual(new List(new List([1,5].map(JelNumber.valueOf))).elements, [1,5].map(JelNumber.valueOf)); 
    });
  });
  
  describe('create()', function() {
    it('creates empty lists', function() {
      jelAssert.equal('List()', new List()); 
    });
    it('creates lists from other lists', function() {
      jelAssert.equal('List(List([1,8]))', new List([1,8].map(JelNumber.valueOf))); 
    });
    it('is equivalent to the built-in lists', function() {
      jelAssert.equal('[4, 2, 1]', new List([4, 2, 1].map(JelNumber.valueOf))); 
    });
  });

  describe('operators list<->list', function() {
    it('compares lists with ==', function() {
      jelAssert.fuzzy('[4, 2, 1] == [4, 2, 1]', 1); 
      jelAssert.fuzzy('[4, 2, 1] == [4, 2, 2]', 0); 
      jelAssert.fuzzy('[4, 2, 1] == [4, 2, 1, 1]', 0); 
      jelAssert.fuzzy('[4, 2, 1, 1] == [4, 2, 1]', 0); 
      jelAssert.fuzzy('[4, 2, 1, 1] != [4, 2, 1]', 1); 

			jelAssert.equal('[4, 2, ApproximateNumber(1, 3), 1] == [4, 2, 2, 1]', 'ApproximateNumber(1, 3) == 2'); 
    });
    it('compares lists with ===', function() {
      jelAssert.fuzzy('[4, 2, 1] === [4, 2, 1]', 1); 
      jelAssert.fuzzy('[4, 2, 1] === [4, 2, 2]', 0); 
      jelAssert.fuzzy('[4, 2, 1] === [4, 2, 1, 1]', 0); 
      jelAssert.fuzzy('[4, 2, 1, 1] === [4, 2, 1]', 0); 
      jelAssert.fuzzy('[4, 2, 1, 1] !== [4, 2, 1]', 1); 
    });
    it('concats with +', function() {
      jelAssert.equal('[4, 2, 1]+[]', new List([4, 2, 1].map(JelNumber.valueOf))); 
      jelAssert.equal('[]+[1, 2, 3]', new List([1, 2, 3].map(JelNumber.valueOf))); 
      jelAssert.equal('[4, 2, 1]+[2, 3]', new List([4, 2, 1, 2, 3].map(JelNumber.valueOf))); 
    });
  });

	
  describe('first', function() {
    it('returns the first', function() {
      jelAssert.equal('[3, 2, 9].first', 3); 
    });
    it('returns undefined if list empty', function() {
      jelAssert.equal('[].first', undefined); 
    });
  });

  describe('last', function() {
    it('returns the last', function() {
      jelAssert.equal('[3, 2, 9].last', 9); 
    });
    it('returns undefined if list empty', function() {
      jelAssert.equal('[].last', undefined); 
    });
  });

  describe('length', function() {
    it('returns the length', function() {
      jelAssert.equal('[1, 3, 2, 9].length', 4); 
      jelAssert.equal('[].length', 0);
    });
  });

  describe('map()', function() {
    it('maps', function() {
      jelAssert.equal('[3, 2, 9].map((a,i)=>a+i)', new List([3, 3, 11].map(JelNumber.valueOf))); 
    });
    it('maps promises', function() {
      return jelAssert.equalPromise('[3, 2, 9, 11, 23].map((a,i)=>if i%2==0 then a+i else JelPromise(a+i+100))', new List([3, 103, 11, 114, 27].map(JelNumber.valueOf))); 
    });
  });

  describe('filter()', function() {
    it('filters', function() {
      jelAssert.equal('[3, 2, 9, 5, 2].filter((a,i)=>a>=3)', new List([3, 9, 5].map(JelNumber.valueOf))); 
    });
    it('filters promises', function() {
      return jelAssert.equalPromise('[7, 3, 2, 7, 5, 3, 6, 9, 8, 1, 2, 11, 23].filter((a,i)=>if i%2==0 then a>3 else JelPromise(a>3))', new List([7, 7, 5, 6, 9, 8, 11, 23].map(JelNumber.valueOf))); 
    });
  });

  describe('each()', function() {
    it('iterates', function() {
      let x = 0;
      const accumulator = new FunctionCallable((ctx, a, i)=>x+=a.value+2*i.value);
      new JEL('[3, 2, 9].each(accumulator)').executeImmediately(DefaultContext.plus({accumulator}));
      assert.equal(x, 20);
    });
    it('iterates with promises', function() {
      let x = 0;
      const accumulator = new FunctionCallable((ctx, a, i)=>Promise.resolve(x+=a.value+2*i.value));
      return new JEL('[3, 2, 9].each(accumulator)').execute(DefaultContext.plus({accumulator}))
				.then(()=>assert.equal(x, 20));
    });
  });

  describe('reduce()', function() {
    it('reduces', function() {
      jelAssert.equal('[3, 2, 9].reduce((ak,a,i)=>ak+a+2*i, 2)', 22); 
      jelAssert.equal('[3, 2, 9, 11].reduce((ak,a,i)=>if i%2==0 then ak+a+2*i else ak+a+i, 2)', 35); 
    });
    it('reduces with promises', function() {
      return jelAssert.equalPromise('[3, 2, 9, 11].reduce((ak,a,i)=>if i%2==0 then ak+a+2*i else JelPromise(ak+a+i), 2)', 35); 
    });
  });

  describe('hasAny()', function() {
    it('finds something', function() {
      jelAssert.equal('[3, 2, 9].hasAny((x,i)=>x>2 && i>0)', JelBoolean.TRUE); 
      jelAssert.equal('[3, 8, 17, 39, 2, 9].hasAny((x,i)=>x>2 && i>0)', JelBoolean.TRUE); 
      return jelAssert.equalPromise('[3, 8, 17, 39, 2, 9].hasAny((x,i)=>JelPromise(x>2 && i>0))', JelBoolean.TRUE); 
    });
    it('finds nothing', function() {
      jelAssert.equal('[3, 2, 9].hasAny((x,i)=>x>5 && i<1)', JelBoolean.FALSE); 
      return jelAssert.equalPromise('[3, 2, 9].hasAny((x,i)=>JelPromise(x>5 && i<1))', JelBoolean.FALSE); 
    });
  });

  describe('hasOnly()', function() {
    it('finds all', function() {
      jelAssert.equal('[3, 2, 9].hasOnly(x=>x>1)', JelBoolean.TRUE); 
      jelAssert.equal('[3, 2, 9].hasOnly((x,i)=>i<10)', JelBoolean.TRUE); 
      return jelAssert.equalPromise('[3, 2, 9].hasOnly((x,i)=>JelPromise(i<10))', JelBoolean.TRUE); 
    });
    it('finds nothing', function() {
      jelAssert.equal('[3, 8, 17, 39, 2, 9].hasOnly(x=>x>2)', JelBoolean.FALSE); 
      jelAssert.equal('[3, 2, 9].hasOnly(x=>x<9)', JelBoolean.FALSE); 
      jelAssert.equal('[3, 2, 9].hasOnly(x=>x<0)', JelBoolean.FALSE);
      jelAssert.equal('[3, 2, 9, 4, 2, 2, 5, 6].hasOnly((x,i)=>i<7)', JelBoolean.FALSE); 
      return jelAssert.equalPromise('[3, 2, 9, 4, 2, 2, 5, 6].hasOnly((x,i)=>JelPromise(i<7))', JelBoolean.FALSE); 
    });
  });

  
  describe('bestMatch()', function() {
    it('handles small lists', function() {
      jelAssert.equal('[].bestMatches((a,b)=>a>b)', new List([])); 
      jelAssert.equal('[1].bestMatches((a,b)=>a>b)', new List([1].map(JelNumber.valueOf)));
      return jelAssert.equal('[1].bestMatches((a,b)=>JelPomise(a>b))', new List([1].map(JelNumber.valueOf)));
    });
    it('matches single elements', function() {
      jelAssert.equal('[3, 2, 9, 5].bestMatches((a,b)=>a>b)', new List([9].map(JelNumber.valueOf))); 
      jelAssert.equal('[9, 2, 3, 5].bestMatches((a,b)=>a>b)', new List([9].map(JelNumber.valueOf))); 
      jelAssert.equal('[1, 3, 3, 5, 9].bestMatches((a,b)=>a>b)', new List([9].map(JelNumber.valueOf))); 
      jelAssert.equal('[9, 2, 3, 5].bestMatches((a,b)=>a<b)', new List([2].map(JelNumber.valueOf))); 
      jelAssert.equal("['foo', 'bar', 'blabla', 'blablabla'].bestMatches((a,b)=>a.length>b.length)", new List(['blablabla'].map(JelString.valueOf))); 
      return jelAssert.equalPromise('[9, 2, 3, 5].bestMatches((a,b)=>if a != 2 then JelPromise(a<b) else a<b)', new List([2].map(JelNumber.valueOf))); 
    });
    it('matches multiple elements', function() {
      jelAssert.equal('[3, 2, 9, 5, 9].bestMatches((a,b)=>a>b)', new List([9, 9].map(JelNumber.valueOf))); 
      jelAssert.equal('[9, 2, 3, 5, 9, 9].bestMatches((a,b)=>a>b)', new List([9, 9, 9].map(JelNumber.valueOf))); 
      jelAssert.equal('[3, 9, 3, 9, 5].bestMatches((a,b)=>a>b)', new List([9, 9].map(JelNumber.valueOf))); 
      jelAssert.equal('[9, 2, 2, 3, 5].bestMatches((a,b)=>a<b)', new List([2, 2].map(JelNumber.valueOf))); 
      jelAssert.equal("['foo', 'bar', 'blabla', 'blablabla'].bestMatches((a,b)=>a.length<b.length)", new List(['foo', 'bar'].map(JelString.valueOf))); 
			return Promise.all([
      	jelAssert.equalPromise('[9, 2, 2, 3, 5, 6, 4, 2, 3].bestMatches((a,b)=>if a<b then JelPromise(true) else false)', new List([2, 2, 2])),
      	jelAssert.equalPromise('[9, 2, 2, 3, 5, 6, 4, 2, 3].bestMatches((a,b)=>if a<b then true else JelPromise(false))', new List([2, 2, 2])),
      	jelAssert.equalPromise('[9, 2, 2, 3, 5, 6, 4, 2, 3].bestMatches((a,b)=>JelPromise(a<b))', new List([2, 2, 2]))
			]);
    });
  });

  describe('sort()', function() {
    it('handles small lists', function() {
      jelAssert.equal('[].sort()', new List([])); 
      jelAssert.equal('[1].sort()', new List([1].map(JelNumber.valueOf))); 
      jelAssert.equal('[].sort((a,b)=>a>b)', new List([])); 
      jelAssert.equal('[1].sort((a,b)=>a>b)', new List([1].map(JelNumber.valueOf))); 
    });
    it('sorts by default sorter', function() {
      jelAssert.equal('[3, 2, 9, 5].sort()', new List([2, 3, 5, 9].map(JelNumber.valueOf))); 
      jelAssert.equal('[1, 2, 3, 4].sort()', new List([1, 2, 3, 4].map(JelNumber.valueOf))); 
      jelAssert.equal('[4, 3, 2, 1].sort()', new List([1, 2, 3, 4].map(JelNumber.valueOf))); 
      jelAssert.equal('[1, 2, 3, 4, 5].sort()', new List([1, 2, 3, 4, 5].map(JelNumber.valueOf))); 
      jelAssert.equal('[5, 1, 2, 3, 4].sort()', new List([1, 2, 3, 4, 5].map(JelNumber.valueOf))); 
      jelAssert.equal('[5, 4, 3, 2, 1].sort()', new List([1, 2, 3, 4, 5].map(JelNumber.valueOf))); 
      jelAssert.equal('[0, 0, 0, 0].sort()', new List([0, 0, 0, 0].map(JelNumber.valueOf))); 
      jelAssert.equal('[0, 0, 0, 1, 0].sort()', new List([0, 0, 0, 0, 1].map(JelNumber.valueOf))); 
      jelAssert.equal('[9, 2, 3, 5].sort()', new List([2, 3, 5, 9].map(JelNumber.valueOf))); 
      jelAssert.equal('[1, 3, 3, 5, 9, 9].sort()', new List([1, 3, 3, 5, 9, 9].map(JelNumber.valueOf))); 
      jelAssert.equal('[1, 4, 3, 6, 3, 7, 8, 2, 5, 9, 9].sort()', new List([1, 2, 3, 3, 4, 5, 6, 7, 8, 9, 9].map(JelNumber.valueOf))); 
      jelAssert.equal('[100, 3, 33, 5, 7, 3, 6, 8, 9, 4, 3, 5, 6, 99, 33, 66, 77, 88, 99, 9].sort()', new List([3, 3, 3, 4, 5, 5, 6, 6, 7, 8, 9, 9, 33, 33, 66, 77, 88, 99, 99, 100].map(JelNumber.valueOf))); 
    });
    it('sorts by lambda', function() {
      jelAssert.equal('[3, 2, 9, 5].sort((a,b)=>a<b)', new List([2, 3, 5, 9].map(JelNumber.valueOf))); 
      jelAssert.equal('[9, 2, 3, 5].sort((a,b)=>a<b)', new List([2, 3, 5, 9].map(JelNumber.valueOf))); 
      jelAssert.equal('[1, 3, 3, 5, 9, 9].sort((a,b)=>a<b)', new List([1, 3, 3, 5, 9, 9].map(JelNumber.valueOf))); 
      jelAssert.equal("['foo', 'blabla', 'bar', 'blablabla'].sort((a,b)=>a.length>b.length)", new List(['blablabla', 'blabla', 'foo', 'bar'].map(JelString.valueOf))); 
    });
    it('sorts by string key', function() {
      class X extends JelObject {
     	  constructor(x) {
					super();
				  this.a = x;
			  }
        static create(ctx, x) {
          return new X(x);
        }
      }
      X.create_jel_mapping = {x:1};
      X.prototype.JEL_PROPERTIES = {a:1};
			
			const je2 = new JelAssert(DefaultContext.plus({X}));

			je2.equal('[X(17), X(3), X(11), X(9)].sort(key="a").map(o=>o.a)', new List([3, 9, 11, 17].map(JelNumber.valueOf))); 
      je2.equal('[X(17), X(3), X(11), X(9)].sort(isLess=(a,b)=>a<b, key="a").map(o=>o.a)', new List([3, 9, 11, 17].map(JelNumber.valueOf))); 
    });
    it('sorts by key function', function() {
      jelAssert.equal('[{a: 17}, {a: 3}, {a: 11}, {a: 9}].sort(key=o=>o.get("a")).map(o=>o.get("a"))', new List([3, 9, 11, 17].map(JelNumber.valueOf))); 
      jelAssert.equal('[{a: 17}, {a: 3}, {a: 11}, {a: 9}].sort((a,b)=>a<b, key=o=>o.get("a")).map(o=>o.get("a"))', new List([3, 9, 11, 17].map(JelNumber.valueOf))); 
      jelAssert.equal('[{a: "xxxx"}, {a: "xx"}, {a: "x"}, {a: "xxxxxx"}].sort(isLess=(a,b)=>a.length<b.length, key=o=>o.get("a")).map(o=>o.get("a"))', new List(["x", "xx", "xxxx", "xxxxxx"].map(JelString.valueOf))); 
    });
    it('handles Promises in the comparator', function() {
      class X extends JelObject {
     	  constructor(x) {
					super();
				  this.a = x;
			  }
				member(ctx, name, parameters) {
					return JelPromise.rnd(ctx, this.a);
				}
				
				static create(ctx, x) {
          return new X(x);
        }
      }
      X.create_jel_mapping = {x:1};

			const je2 = new JelAssert(DefaultContext.plus({X}));
			
			JelPromise.resetRnd();
			return Promise.all([
				jelAssert.equalPromise('[3, 1, 2].sort((a,b)=>JelPromise(a<b))', new List([1, 2, 3])),
				jelAssert.equalPromise('[2, 1].sort((a,b)=>JelPromise(a<b))', new List([1, 2])),
				jelAssert.equalPromise('[2, 1].sort((a,b)=>JelPromise(a>b))', new List([2, 1])),
				jelAssert.equalPromise('[1, 2, 3, 4, 5, 6].sort((a,b)=>JelPromise(a<b))', new List([1, 2, 3, 4, 5, 6])),
				jelAssert.equalPromise('[1, 2, 3, 4, 5, 6].sort((a,b)=>JelPromise.rnd(a<b))', new List([1, 2, 3, 4, 5, 6])),
				jelAssert.equalPromise('[10, 2, 30, 4, 50, 6, 1, 3, 4, 50, 50, 5].sort((a,b)=>JelPromise.rnd(a<b))', new List([1, 2, 3, 4, 4, 5, 6, 10, 30, 50, 50, 50])),
				je2.equalPromise('[X(17), X(3), X(11), X(9), X(20), X(22)].sort((a,b)=>a<b, key="a").map(o=>o.a)', new List([3, 9, 11, 17, 20, 22])),
				jelAssert.equalPromise('[{a: 17}, {a: 3}, {a: 11}, {a: 9}].sort((a,b)=>a<b, key=o=>JelPromise.rnd(o.get("a"))).map(o=>o.get("a"))', new List([3, 9, 11, 17]))
			]);
    });

		
  });
	
	
  describe('min()/max()', function() {
    it('handles small lists', function() {
      jelAssert.equal('[].min()', undefined);
      jelAssert.equal('[].max()', undefined);
      jelAssert.equal('[1].min()', 1);
      jelAssert.equal('[1].max()', 1);
      jelAssert.equal('[].min((a,b)=>a>b)', undefined);
      jelAssert.equal('[1].max((a,b)=>a>b)', 1);
			return jelAssert.equalPromise('[1].max((a,b)=>JelPromise(a>b))', 1);
    });
    it('find by default sorter', function() {
      jelAssert.equal('[3, 2, 9, 5].min()', 2);
      jelAssert.equal('[3, 2, 9, 5].max()', 9);
      jelAssert.equal('[1, 3, 3, 5, 9, 9].max()', 9);
    });
    it('find by lambda', function() {
      jelAssert.equal('[3, 2, 9, 5].max((a,b)=>a<b)', 9);
      jelAssert.equal('[9, 2, 3, 5].min((a,b)=>a<b)', 2)
      jelAssert.equal("['foo', 'blabla', 'bar', 'blablabla'].min((a,b)=>a.length<b.length)", '"bar"');
      jelAssert.equal("['foo', 'blabla', 'bar', 'blablabla'].max((a,b)=>a.length<b.length)", '"blablabla"');
    });
    it('finds by string key', function() {
      class X extends JelObject {
     	  constructor(x) {
					super();
				  this.a = x;
			  }
				member(ctx, name, parameters) {
					return JelPromise.rnd(ctx, this.a);
				}
        static create(ctx, x) {
          return new X(x);
        }
      }
      X.create_jel_mapping = {x:1};
      X.prototype.JEL_PROPERTIES = {a:1};
			
			JelPromise.resetRnd();
			const je2 = new JelAssert(new Context(ctx).setAll({X}));

			return Promise.all([
				je2.equalPromise('[X(17), X(3), X(11), X(9)].min(key="a").a', 3),
				je2.equalPromise('[X(17), X(3), X(11), X(9)].max(key="a").a', 17), 
				je2.equalPromise('[X(17), X(3), X(11), X(9)].min(isLess=(a,b)=>a<b, key="a").a', 3),
				je2.equalPromise('[X(17), X(3), X(11), X(9)].max(isLess=(a,b)=>JelPromise(a<b), key="a").a', 17) 
			]);
    });
    it('find by key function', function() {
      jelAssert.equal('[{a: 17}, {a: 3}, {a: 11}, {a: 9}].min(key=o=>o.get("a")).get("a")', 3); 
      jelAssert.equal('[{a: 17}, {a: 3}, {a: 11}, {a: 9}].max(key=o=>o.get("a")).get("a")', 17); 
      jelAssert.equal('[{a: 17}, {a: 3}, {a: 11}, {a: 9}].min((a,b)=>a<b, key=o=>o.get("a")).get("a")', 3); 
      jelAssert.equal('[{a: 17}, {a: 3}, {a: 11}, {a: 9}].max((a,b)=>a<b, key=o=>o.get("a")).get("a")', 17); 
      jelAssert.equal('[{a: "xxxx"}, {a: "xx"}, {a: "x"}, {a: "xxxxxx"}].min(isLess=(a,b)=>a.length<b.length, key=o=>o.get("a")).get("a")', "'x'"); 
      jelAssert.equal('[{a: "xxxx"}, {a: "xx"}, {a: "x"}, {a: "xxxxxx"}].max(isLess=(a,b)=>a.length<b.length, key=o=>o.get("a")).get("a")', "'xxxxxx'"); 
			return jelAssert.equalPromise('[{a: 17}, {a: 3}, {a: 11}, {a: 9}].max((a,b)=>JelPromise(a<b), key=JelPromise.rnd(o=>o.get("a"))).get("a")', 17); 
    });
  });

  describe('sub()', function() {
    it('handles small lists', function() {
      jelAssert.equal('[].sub(0, 100)', new List([]));
      jelAssert.equal('[].sub(-2, 5)', new List([]));
      jelAssert.equal('[].sub(0)', new List([]));
      jelAssert.equal('[1].sub(0,100)', new List([1].map(JelNumber.valueOf)));
      jelAssert.equal('[1].sub(-1,5)', new List([1].map(JelNumber.valueOf)));
      jelAssert.equal('[1].sub(-1)', new List([1].map(JelNumber.valueOf)));
      jelAssert.equal('[1].sub(0, 0)', new List([]));
    });
    it('allows flexible params', function() {
      jelAssert.equal('[3, 2, 9, 5].sub(0, 5)', new List([3, 2, 9, 5].map(JelNumber.valueOf)));
      jelAssert.equal('[9, 2, 3, 5].sub(0)', new List([9, 2, 3, 5].map(JelNumber.valueOf)));
      jelAssert.equal('[1, 3, 3, 5, 9, 9].sub(-3, 100)', new List([5, 9, 9].map(JelNumber.valueOf)));
      jelAssert.equal('[1, 3, 3, 5, 9, 9].sub(-3, -2)', new List([5].map(JelNumber.valueOf)));
      jelAssert.equal('[1, 3, 3, 5, 9, 9].sub(-3, -100)', new List([]));
      jelAssert.equal("['foo', 'blabla', 'bar', 'blablabla'].sub()", new List(['foo', 'blabla', 'bar', 'blablabla'].map(JelString.valueOf)));
    });
    it('creates smaller lists', function() {
      jelAssert.equal('[3, 2, 9, 5].sub(1)', new List([2, 9, 5].map(JelNumber.valueOf)));
      jelAssert.equal('[3, 2, 9, 5].sub(2)', new List([9, 5].map(JelNumber.valueOf)));
      jelAssert.equal('[3, 2, 9, 5].sub(-2)', new List([9, 5].map(JelNumber.valueOf)));
      jelAssert.equal('[3, 2, 9, 5].sub(1, 2)', new List([2].map(JelNumber.valueOf)));
      jelAssert.equal('[3, 2, 9, 5].sub(1, 3)', new List([2, 9].map(JelNumber.valueOf)));
      jelAssert.equal('[9, 2, 3, 5].sub(-3, -1)', new List([2, 3].map(JelNumber.valueOf)));
      jelAssert.equal('[1, 3, 3, 5, 9, 9].sub()', new List([1, 3, 3, 5, 9, 9].map(JelNumber.valueOf)));
      jelAssert.equal("['foo', 'blabla', 'bar', 'blablabla'].sub(2, -1)", new List(['bar'].map(JelString.valueOf)));
    });
  });

});

