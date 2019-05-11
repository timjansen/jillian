'use strict';

require('source-map-support').install();
const assert = require('assert');

const Context = require('../../build/jel/Context.js').default;
const DefaultContext = require('../../build/jel/DefaultContext.js').default;
const BaseTypeRegistry = require('../../build/jel/BaseTypeRegistry.js').default;
const JEL = require('../../build/jel/JEL.js').default;
const Callable = require('../../build/jel/Callable.js').default;
const JelBoolean = require('../../build/jel/types/JelBoolean.js').default;
const JelObject = require('../../build/jel/JelObject.js').default;
const NativeJelObject = require('../../build/jel/types/NativeJelObject.js').default;
const JelString = require('../../build/jel/types/JelString.js').default;
const Float = require('../../build/jel/types/Float.js').default;
const JelList = require('../../build/jel/types/List.js').default;
const JelDictionary = require('../../build/jel/types/Dictionary.js').default;
const Fraction = require('../../build/jel/types/Fraction.js').default;
const UnitValue = require('../../build/jel/types/UnitValue.js').default;
const OptionalType = require('../../build/jel/types/typeDescriptors/OptionalType.js').default;
const TypeHelper = require('../../build/jel/types/typeDescriptors/TypeHelper.js').default;
const JelNode = require('../../build/jel/expressionNodes/JelNode.js').default;
const Literal = require('../../build/jel/expressionNodes/Literal.js').default;
const Variable = require('../../build/jel/expressionNodes/Variable.js').default;
const Operator = require('../../build/jel/expressionNodes/Operator.js').default;
const List = require('../../build/jel/expressionNodes/List.js').default;
const Reference = require('../../build/jel/expressionNodes/Reference.js').default;
const Condition = require('../../build/jel/expressionNodes/Condition.js').default;
const Assignment = require('../../build/jel/expressionNodes/Assignment.js').default;
const Let = require('../../build/jel/expressionNodes/Let.js').default;
const Lambda = require('../../build/jel/expressionNodes/Lambda.js').default;
const Call = require('../../build/jel/expressionNodes/Call.js').default;

const {plus, JelAssert, JelPromise, JelConsole, MockSession, PromiseType} = require('../jel-assert.js');
const jelAssert = new JelAssert();

describe('JEL', function () {
  let defaultContext, ctx;
  before(function(){
    return DefaultContext.get().then(dc=> {
      defaultContext = dc;
      return plus(dc).then(c=> {
        ctx = c.plus(new MockSession());
        jelAssert.setCtx(ctx);
      });    
    });
  });
  

  describe('execute()', function() {

    it('should execute a UnitValues', function() {
      jelAssert.equal('1 @Meter', new UnitValue(Float.valueOf(1), 'Meter'));
      jelAssert.equal('5.5 @Meter', new UnitValue(Float.valueOf(5.5), 'Meter'));
      jelAssert.equal('-2 @Second', new UnitValue(Float.valueOf(-2), 'Second'));
      jelAssert.equal('+3 @Second', new UnitValue(Float.valueOf(3), 'Second'));
      jelAssert.equal('1/4 @Inch', new UnitValue(new Fraction(1, 4), 'Inch'));
      jelAssert.equal('-3/4 @Mile', new UnitValue(new Fraction(-3, 4), 'Mile'));
      jelAssert.equal('1 @Meter + 1 @Meter', new UnitValue(Float.valueOf(2), 'Meter'));
    });

    it('should support references', function() {
      assert.equal(new JEL('@Hello').executeImmediately(ctx).distinctName, 'Hello');
      assert.equal(new JEL('@Fish').executeImmediately(ctx).distinctName, 'Fish');
    });

    it('should support optional types', function() {
      assert.ok(new JEL('Float?').executeImmediately(ctx) instanceof OptionalType);
      assert.equal(new JEL('Float?').executeImmediately(ctx).type.type, 'Float');
      assert.equal(new JEL('(Float)?').executeImmediately(ctx).type.type, 'Float');
    });

    it('should convert convenience types automatically', function() {
      assert.equal(TypeHelper.convertNullableFromAny(new JEL('Boolean').executeImmediately(ctx), 'unit test').toString(), 'SimpleType("Boolean")');
      assert.equal(TypeHelper.convertNullableFromAny(new JEL('String').executeImmediately(ctx), 'unit test').toString(), 'SimpleType("String")');
      assert.equal(TypeHelper.convertNullableFromAny(new JEL('1...3').executeImmediately(ctx), 'unit test').toString(), 'number(Range(1,3))');
    });
    
     it('should support instanceof', function() {     
      jelAssert.equal("3 instanceof any", "true");
      jelAssert.equal("3 instanceof number", "true");
      jelAssert.equal("null instanceof number", "false");
      jelAssert.equal("null instanceof string", "false");
      jelAssert.equal("null instanceof bool", "false");
      jelAssert.equal("'hello' instanceof string", "true");
      jelAssert.equal("'' instanceof string", "false");
      jelAssert.equal("true instanceof string", "false");
      jelAssert.equal("'hello' instanceof bool", "false");
      jelAssert.equal("true instanceof bool", "true");
      jelAssert.equal("null instanceof int", "false");
      jelAssert.equal("1/2 instanceof int", "false");
      jelAssert.equal("0.5 instanceof int", "false");
      jelAssert.equal("42 instanceof int", "true");
      jelAssert.equal("42/3 instanceof int", "true");

      jelAssert.equal("3 instanceof Float", "true");
      jelAssert.equal("null instanceof Float", "false");
      jelAssert.equal("'hello' instanceof Float", "false");
      jelAssert.equal("true instanceof Float", "false");
      jelAssert.equal("3 instanceof String", "false");
      jelAssert.equal("null instanceof String", "false");
      jelAssert.equal("'hello' instanceof String", "true");
      jelAssert.equal("true instanceof String", "false");
      jelAssert.equal("3 instanceof Boolean", "false");
      jelAssert.equal("'hello' instanceof Boolean", "false");
      jelAssert.equal("true instanceof Boolean", "true");

      jelAssert.equal("3 instanceof Float?", "true");
      jelAssert.equal("null instanceof Float?", "true");
      jelAssert.equal("'hello' instanceof Float?", "false");
      jelAssert.equal("true instanceof Float?", "false");

      jelAssert.equal("3 instanceof Float|String", "true");
      jelAssert.equal("null instanceof Float|String", "false");
      jelAssert.equal("'hello' instanceof Float|String", "true");
      jelAssert.equal("true instanceof Float|String", "false");
      jelAssert.equal("null instanceof Float|String?", "true");

      jelAssert.equal("3 instanceof number<>", "true");
      jelAssert.equal("2.3 instanceof int<>", "false");
      jelAssert.equal("'str' instanceof number<>", "false");
      jelAssert.equal("Range(2, 3) instanceof number<>", "true");
      jelAssert.equal("Range(2, 3) instanceof int<>", "true");
      jelAssert.equal("Range(2, 5/2) instanceof int<>", "false");
      jelAssert.equal("{a:1, b:2} instanceof {a: int, b: int}", "true");
      jelAssert.equal("{a:1, b:3.3} instanceof {a: int, b: int}", "false");
      jelAssert.equal("{a: 5} instanceof int[]{}", "false");      

      jelAssert.equal("0.5 instanceof 2...3", "false");
      jelAssert.equal("0.5 instanceof 0...3", "true");
     });

     it('should support as for type checking', function() {
      jelAssert.equal("true as any", "true");
      jelAssert.equal("null as any", "null");
      jelAssert.equal("3 as Float", "3");
      jelAssert.equal("'hello' as String", "'hello'");
      jelAssert.equal("true as Boolean", "true");
      jelAssert.equal("3 as Float?", "3");
      jelAssert.equal("null as Float?", "null");
      jelAssert.equal("3 as Float|String", "3");
      jelAssert.equal("'hello' as Float|String", "'hello'");
      jelAssert.equal("null as Float|String?", "null");
      jelAssert.equal("[1, 2] as int[]", "[1,2]");
      jelAssert.equal("5 as int[]", "[5]");
      jelAssert.equal("null as int[]", "[]");
     });

     it('should support as for type conversion', function() {
      jelAssert.equal("null as any[]", "[]");
      jelAssert.equal("'a' as any[]", "['a']");
      jelAssert.equal("5 as int[]", "[5]");
      jelAssert.equal("[null] as int{}[]", "[{}]");

      jelAssert.equal("null as any{}", "{}");
      jelAssert.equal("{a: 5} as int[]{}", "{a:[5]}");

      jelAssert.equal("null as any{}", "{}");
      jelAssert.equal("{a: 5} as int[]{}", "{a:[5]}");

      //return jelAssert.errorPromise("true as String|Float");
     });

     it('supports try/when', function() {
      jelAssert.equal('try null when string: 1 when int: 2 when Date: 3 else 4', 4);
      jelAssert.equal('try null when string?: 1 when int: 2 when Date: 3 else 4', 1);
      jelAssert.equal('try 5 when string: 1 when int: 2 when Date: 3 else 4', 2);
      jelAssert.equal('try "x" when string: 1 when int: 2 when Date: 3 else 4', 1);
      jelAssert.equal('try 2 else 0 when string: 1 when int: 2 when Date: 3', 0);
      jelAssert.equal('try "test" when string[]: 1 when int: 2 when Date: 3', "'test'");

      jelAssert.equal('try a = 5 when string: a when int:a+2 when Date: 3 else a', 7);
      jelAssert.equal('try a = 5 when string: a when Date: 3 else a', 5);

      jelAssert.equal('try a = 5 when string: 1 if a<5: false when int:a+2 when Date: 3 else a', 7);
      jelAssert.equal('try a = 5 when string: 1 if a<=5: false when int:a+2 when Date: 3 else a', "false");

      jelAssert.equal('try a = 5 when string: when int: when Date: 3 else a', 3);
      jelAssert.equal('try a = 5 when string: when Date: 3 else a', 5);
    });

    it('supports throw and try/catch', function() {
      jelAssert.equal('try 4 catch: 1', 4);
      jelAssert.equal('try null catch: 1', null);
      jelAssert.equal('try null catch: 1 else 2', 2);
      jelAssert.equal('try 1 catch: 1 else 2', 2);
      return Promise.all([jelAssert.equalPromise('try throw Exception() catch: 1 else 2', 1), 
      jelAssert.equalPromise('try e = throw Exception("blaA") catch: e.message else 2', "'blaA'"),
      jelAssert.errorPromise('try e = throw Exception("blaB") catch RuntimeError: e.message else 2', "blaB"),
      jelAssert.equalPromise('try e = throw Exception("blaC") catch: e.message else 2', "'blaC'"),

      jelAssert.equalPromise('try e = throw "bla1" catch: e.message else 2', "'bla1'"),
      jelAssert.equalPromise('try e = throw "bla2" catch Exception: e.message else 2', "'bla2'"),
      jelAssert.errorPromise('try e = throw "bla3" catch string: e.message else 2', "bla3"),
      jelAssert.errorPromise('try e = throw "bla4" catch string: e.message', "bla4"),
      jelAssert.equalPromise('try e = throw "bla5" catch any: e.message else 2', "'bla5'"),
      jelAssert.equalPromise('try e = throw "bla6" catch any: e.message catch Exception: 2 else 2', "'bla6'"),
      jelAssert.equalPromise('try e = throw "bla7" catch Exception: e.message catch any: 2 else 2', "'bla7'"),
      jelAssert.equalPromise('try e = throw "bla8" catch RuntimeError: e.message catch any: 2 else 5', "2"),
      jelAssert.equalPromise('try "a" === 1 catch Exception: 1 catch RuntimeError: 2', "2"),
      jelAssert.equalPromise('try "a" === 1 when Exception: 0 catch Exception: 1 catch RuntimeError: 2', "2"),
      jelAssert.equalPromise('try "a" === 1 if null: 0 catch Exception: 1 catch RuntimeError: 2', "2"),
      jelAssert.errorPromise('try "a" === 1 when int: 2', "not supported for type"),
      jelAssert.equalPromise('try throw null catch RuntimeError: 2', "2"),
      jelAssert.equalPromise('try "a" === 1 if true: 0 catch: 2', "2")]);
    });


     it('should support in', function() {
      jelAssert.equal("2 in 1...10", "true");
      jelAssert.equal("1 in 1...10", "true");
      jelAssert.equal("10 in 1...10", "true");
      jelAssert.equal("20 in 1...10", "false");
      jelAssert.equal("'a' in ['a', 'b', 'c']", "true");
      jelAssert.equal("'d' in ['a', 'b', 'c']", "false");
      jelAssert.equal("'a' in {a:1, b:1}", "true");
      jelAssert.equal("'b' in {a:1, b:1}", "true");
      //return jelAssert.errorPromise("1 in 1");
     });

     it('should execute string literals', function() {
      jelAssert.equal("'abc'", '"abc"');
      jelAssert.equal("'abc{}def'", '"abc{}def"');
      jelAssert.equal("'abc{{5}}def'", '"abc5def"');
      jelAssert.equal("'abc{{1+2}}def'", '"abc3def"');
      jelAssert.equal("'{{1}}{{2}}{{3}}'", '"123"');
      jelAssert.equal("let a=1: '{{a}}'", '"1"');
      jelAssert.equal("let a='x', b='y': '{{a}} {{b}}'", '"x y"');
     });

     it('should support Promises in Types', function() {
        return Promise.all([jelAssert.equalPromise("3 instanceof string|PromiseType(number)|null|bool", "true"),
        jelAssert.equalPromise("'str' instanceof string|PromiseType(number)|null|bool", "true"),
        jelAssert.equalPromise("null instanceof string|PromiseType(number)|null|bool", "true"),
        jelAssert.equalPromise("[] instanceof string|PromiseType(number)|null|bool", "false"),
        jelAssert.equalPromise("3 instanceof PromiseType(string)|PromiseType(number)|PromiseType(bool)", "true"),
        jelAssert.equalPromise("{} instanceof PromiseType(string)|PromiseType(number)|PromiseType(bool)", "false"),

        jelAssert.equalPromise("[true, false, 2, true] instanceof PromiseType(bool)[]", "false"),
        jelAssert.equalPromise("[true, false, true] instanceof PromiseType(bool)[]", "true"),

        jelAssert.equalPromise("{a: true, b: 'false', c: true} instanceof PromiseType(bool){}", "false"),
        jelAssert.equalPromise("{a: true, b: false, c: true} instanceof PromiseType(bool){}", "true"),

        jelAssert.equalPromise("{a: true, b: 'false', c: true} instanceof {a: PromiseType(bool), b: PromiseType(bool), c: bool}", "false"),
        jelAssert.equalPromise("{a: true, b: false, c: true} instanceof {a: PromiseType(bool), b: PromiseType(bool), c: bool}", "true"),

        jelAssert.equalPromise("true instanceof PromiseType(bool)?", "true"),
        jelAssert.equalPromise("null instanceof PromiseType(bool)?", "true"),
        jelAssert.equalPromise("1 instanceof PromiseType(bool)?", "false"),

        jelAssert.equalPromise("{a: [true], b: [], c: false} instanceof PromiseType(bool)[]{}", "false"),
        jelAssert.equalPromise("{a: [true], b: [], c: [false, true]} instanceof PromiseType(bool)[]{}", "true")
     ]);
    });

  it('supports list literals using the regular syntax [] with promises', function() {
    return new JEL('[JelPromise(2), 0, JelPromise.resolve(8), JelPromise(9), JelPromise.resolve(7), 5]').execute(ctx).then(r=> assert.deepEqual(r.elements, [2, 0, 8, 9, 7, 5].map(Float.valueOf)));
  });

  it('supports dictionary literals with promises', function() {
    return new JEL("{a: JelPromise(1), b: 2, c: JelPromise(3), d: JelPromise.resolve(6)}").execute(ctx).then(r=>assert.deepEqual(r.toObjectDebug(), {a: Float.valueOf(1), b: Float.valueOf(2), c: Float.valueOf(3), d: Float.valueOf(6)}));
  });

   it('should access properties of built-ins', function() {
     jelAssert.equal(new JEL('"foobar".length').executeImmediately(), 6);
   });

   it('should access methods of built-ins', function() {
     jelAssert.equal(new JEL('" foobar   ".trim()').executeImmediately(), "'foobar'");
   });

   it('supports lambda', function() {
      assert(new JEL('a=>1').executeImmediately(new Context()) instanceof Callable);
      jelAssert.equal(new JEL('a=>55').executeImmediately(new Context()).invokeWithObject(null, []), 55);
      jelAssert.equal(new JEL('x=>x').executeImmediately(defaultContext).invokeWithObject(null, [Float.valueOf(66)]), 66);
      jelAssert.equal(new JEL('x=>x').executeImmediately(defaultContext).invokeWithObject(Float.valueOf(42), [Float.valueOf(66)]), 66);
      jelAssert.equal(new JEL('x=>x').executeImmediately(defaultContext).invoke(Float.valueOf(66)), null);
      jelAssert.equal(new JEL('x=>x').executeImmediately(defaultContext).invokeWithObject(null, [], new Map(Object.entries({x:Float.valueOf(66)}))), 66);
      jelAssert.equal(new JEL('x=>x').executeImmediately(defaultContext).invokeWithObject(Float.valueOf(42), [], new Map(Object.entries({x:Float.valueOf(66)}))), 66);
      jelAssert.equal(new JEL('(a,b)=>a+b').executeImmediately(defaultContext).invokeWithObject(null, [], new Map(Object.entries({a:Float.valueOf(40),b:Float.valueOf(2)}))), 42);
      jelAssert.equal(new JEL('(a,b)=>a+b').executeImmediately(defaultContext).invokeWithObject(null, [Float.valueOf(40)], new Map(Object.entries({b:Float.valueOf(2)}))), 42);
      jelAssert.equal(new JEL('(a,b)=>b').executeImmediately(defaultContext).invokeWithObject(null, []), null);

      jelAssert.equal(new JEL('()=>this').executeImmediately(defaultContext).invokeWithObject(Float.valueOf(42), []), 42);
      jelAssert.equal(new JEL('(x)=>this+x').executeImmediately(defaultContext).invokeWithObject(Float.valueOf(42), [Float.valueOf(66)]), 108);

      jelAssert.equal(new JEL('(x=>x)(66)').executeImmediately(defaultContext), 66);
      jelAssert.equal(new JEL('(x=>x)(x=66)').executeImmediately(defaultContext), 66);
      jelAssert.equal(new JEL('((x)=>x)(x=66)').executeImmediately(defaultContext), 66);
      jelAssert.equal(new JEL('((a,b)=>a+b)(20, 22)').executeImmediately(defaultContext), 42);
      jelAssert.equal(new JEL('((a,b)=>a+b)(b=20, a=22)').executeImmediately(defaultContext), 42);

      jelAssert.equal(new JEL('((a=1,b=2)=>a+b)()').executeImmediately(defaultContext), 3);
      jelAssert.equal(new JEL('((a=1,b=2)=>a+b)(5)').executeImmediately(defaultContext), 7);

      jelAssert.equal(new JEL('((a: number = 1,b: number=2)=>a+b)(5)').executeImmediately(defaultContext), 7);
      jelAssert.equal(new JEL('((a: number?)=>a)(5)').executeImmediately(defaultContext), 5);
      jelAssert.equal(new JEL('((a: number?)=>a)(null)').executeImmediately(defaultContext), null);
      jelAssert.equal(new JEL('((a: number?=null)=>a)()').executeImmediately(defaultContext), null);

      jelAssert.equal(new JEL('((a: number?): number=>a)(5)').executeImmediately(defaultContext), 5);
      jelAssert.equal(new JEL('((a: number?): number?=>a)(null)').executeImmediately(defaultContext), null);
      jelAssert.equal(new JEL('((a: number?=null): number?=>a)()').executeImmediately(defaultContext), null);
      jelAssert.equal(new JEL('((a: int[]): int[]=>a[0])(5)').executeImmediately(defaultContext), '[5]');


      return Promise.all([jelAssert.errorPromise('((a: number?): string => a)(42)'), 
                          jelAssert.errorPromise('((a: number?) => a)("this is a string")'),
                          jelAssert.errorPromise('((a: PromiseType(number))=>a)("this is a string")'),
                          jelAssert.equalPromise('((a: PromiseType(number))=>a)(5)', 5),
                          jelAssert.equalPromise('((a: PromiseType(number))=>a)(a=5)', 5),
                          jelAssert.equalPromise('((a: PromiseType(number), b: PromiseType(string?), c: PromiseType(any))=>[a,b,c])(7, null, c=6)', '[7,null,6]'),
                          jelAssert.equalPromise('((a: PromiseType(number), b: PromiseType(string?), c: PromiseType(any))=>[a,b,c])(a=7, b="n", c=6)', '[7,"n",6]'),
                          jelAssert.equalPromise('((a: PromiseType(number), b: PromiseType(string?), c: PromiseType(any))=>[a,b,c])(7, "n", 6)', '[7,"n",6]')
                         ]);
   });

   it('supports lambda varargs', function() {
      jelAssert.equal('((...a: int[])=>a)(1,2,3)', '[1,2,3]');
      jelAssert.equal('((...a: int[])=>a)()', '[]');
      jelAssert.equal('((...a: int[][])=>a)([1], [5])', '[[1], [5]]');
      jelAssert.equal('((...a: int[])=>a)(a=[1,2])', '[1, 2]');
      jelAssert.equal('((...a: int[])=>a)(a=5)', '[5]');
      jelAssert.equal('((x: number?, y: int?, ...a: int[])=>[x,y,a])(1,2,3,4)', '[1,2,[3, 4]]');
      jelAssert.equal('((x, y, ...a: int[])=>[x,y,a])(1,2)', '[1,2,[]]');
      jelAssert.equal('((x: int, y: number, ...a: int[])=>[x,y,a])(1,2, a=[11])', '[1,2,[11]]');
      jelAssert.equal('((x, y, ...a: int[])=>[x,y,a])(1,2, a=11)', '[1,2,[11]]');
      jelAssert.equal('((x = 2, y = 5, ...a: int[])=>[x,y,a])()', '[2,5,[]]');
      jelAssert.equal('((x = 2, y = 5, ...a: int[])=>[x,y,a])(y=3, a=[1, 2])', '[2,3,[1,2]]');
   });
    
   it('catches lambda vararg errors', function() {
     return Promise.all([
       jelAssert.errorPromise("((...a: int)=>a)", "must be a ListType"),
       jelAssert.errorPromise("((...a: int[]?)=>a)", "must be a ListType"),
       jelAssert.errorPromise("((...a: int[] = [])=>a)", "always an empty List"),
       jelAssert.errorPromise("((...a: int[] = [1,2])=>a)", "always an empty List"),
       jelAssert.errorPromise("((...a: string[])=>a)(['boo'])", "not compatible"),
       jelAssert.errorPromise("((...a: string[])=>a)(1)", "not compatible"),
       jelAssert.errorPromise("((...a: string[])=>a)(a=1)", "not compatible"),
       jelAssert.errorPromise("((...a: string[])=>a)('a', 'b', 1, 'c')", "not compatible")
     ])
   });
    
   it('supports promises', function() {
     let clsA

     class A extends NativeJelObject {
      static promise(ctx, value) {
       return new Promise((resolve)=>setTimeout(()=>resolve(value), 1));
      }
      get clazz() {
        return clsA;
      }
     }
     A.promise_jel_mapping = true;
     A.x = 42;
     A.x_jel_property = true;
     BaseTypeRegistry.register('A', A);
     clsA = new JEL('native class A: static native promise(value) static native x: any').executeImmediately(ctx);
     
     const l = [];
     const ctxPlusA = new Context().setAll({A: clsA});
     l.push(JEL.execute('A.promise(3)+4', '(unit test)', ctxPlusA).then(v=>assert.equal(v, 7)));
     l.push(JEL.execute('3+A.promise(4)', '(unit test)', ctxPlusA).then(v=>assert.equal(v, 7)));
     l.push(JEL.execute('A.promise(3)+A.promise(4)', '(unit test)', ctxPlusA).then(v=>assert.equal(v, 7)));
     l.push(JEL.execute('A.promise(A.x)+A.promise(A.x)', '(unit test)', ctxPlusA).then(v=>assert.equal(v, 84)));
     l.push(JEL.execute('A.promise(A)[A.promise("x")]', '(unit test)', ctxPlusA).then(v=>assert.equal(v, 42)));
     l.push(JEL.execute('A.promise(A).promise(A.promise(3))', '(unit test)', ctxPlusA).then(v=>assert.equal(v, 3)));
     l.push(JEL.execute('if (!A.promise(0)) then A.promise(4) else 5', '(unit test)', ctxPlusA).then(v=>assert.equal(v, 4)));
     l.push(JEL.execute('((a,b,c,d,e)=>a+4*b+5*c+30*d+100*e)(A.promise(2), 5, A.promise(1), d=A.promise(10), e=1)', '(unit test)', ctxPlusA).then(v=>assert.equal(v, 427)));

     return Promise.all(l);
   });

   it('has proper stacktraces for exceptions with method calls', function() {
    return jelAssert.errorPromise(`let f = x=>x.fE(),\n
     x = class X:\n
      constructor()\n
      fA()=>this.fB(1, "bla", LocalDate(2019, 3, 1))\n
      fB(x, y, z)=>this.fC([1, 2, 3], {a:1, b:4})\n
      fC(a, b, c)=>f(this)\n
      fE()=>throw "Oops":\n
        x().fA()`, ['Oops', 'TESTTEST']);
   });

   it('has proper stacktraces for exceptions with function calls', function() {
    return jelAssert.errorPromise(`let f = ()=>throw "Oops",\n
          e = (a, b, c)=>f(),\n
          g = (x, y, z)=>e(1, "2", 2 @Meter):\n
            g([1, 2], {r: 2, e: 2}, null)`, ['Oops', 'TESTTEST']);
   });

   it('has proper stacktraces for runtime errors', function() {
    return jelAssert.errorPromise(`let f = ()=> null.a(),\n
      e = (a, b, c)=>f(),\n
      g = (x, y, z)=>e(1, "2", 2 @Meter):\n
        g([1, 2], {r: 2, e: 2}, null)`, ['Oops', 'TESTTEST']);
   });

  });
});
