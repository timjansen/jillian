'use strict';

require('source-map-support').install();
const assert = require('assert');

const Context = require('../../build/jel/Context.js').default;
const DefaultContext = require('../../build/jel/DefaultContext.js').default;
const JEL = require('../../build/jel/JEL.js').default;
const NativeClass = require('../../build/jel/NativeClass.js').default;
const FunctionCallable = require('../../build/jel/FunctionCallable.js').default;
const Callable = require('../../build/jel/Callable.js').default;
const JelBoolean = require('../../build/jel/types/JelBoolean.js').default;
const JelObject = require('../../build/jel/JelObject.js').default;
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

const {JelAssert, JelPromise, JelConsole, MockSession, PromiseType} = require('../jel-assert.js');
const jelAssert = new JelAssert();

describe('JEL', function () {
  let defaultContext, ctx;
  before(function(){
    return DefaultContext.get().then(dc=> {
      defaultContext = dc;
      ctx = defaultContext.plus({JelPromise: new NativeClass(JelPromise), JelConsole: new NativeClass(JelConsole), PromiseType: new NativeClass(PromiseType)}).plus(new MockSession());
      jelAssert.setCtx(ctx);
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
      assert.equal(new JEL('@Fish(age= 10)').executeImmediately(ctx).distinctName, 'Fish');
      assert.equal(new JEL('@Fish(age= 10)').executeImmediately(ctx).params.get('age'), 10);
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
      jelAssert.equal("{a:1, b:2} as {a: int, b: int}", "{a:1, b:2}");
      //return jelAssert.errorPromise("true as String|Float");
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

    it('should access member fields of JelObjects', function() {
      class A extends JelObject {
        constructor() {
          super();
          this.x = 3;
          this.y = "foo";
        }
      }
      A.prototype.JEL_PROPERTIES = {x:1,y:1};

      jelAssert.equal(new JEL('a.x').executeImmediately(new Context().setAll({a:new A()})), 3);
      jelAssert.equal(new JEL('(a).y').executeImmediately(new Context().setAll({a:new A()})), "'foo'");
      jelAssert.equal(new JEL('(a)["y"]').executeImmediately(new Context().setAll({a:new A()})), "'foo'");
      assert.throws(()=>new JEL('(a).z').executeImmediately(new Context().setAll({a:new A()})));
      assert.throws(()=>new JEL('(a) . 5').executeImmediately(new Context().setAll({a:new A()})));
      assert.throws(()=>new JEL('(a)."x"').executeImmediately(new Context().setAll({a:new A()})));

      class B extends JelObject {
        constructor(ref) {
          super();
          this.ref = ref;
        }
      }
      B.prototype.JEL_PROPERTIES = {ref:1};

      jelAssert.equal(new JEL('b.ref').executeImmediately(new Context().setAll({b: new B(Float.valueOf(5))})), 5);
      jelAssert.equal(new JEL('b.ref.ref.ref').executeImmediately(new Context().setAll({b: new B(new B(new B(Float.valueOf(7))))})), 7);
   });

   it('should access methods of JelObjects', function() {
      class A extends JelObject {
        constructor(a = Float.valueOf(2), b = Float.valueOf(5)) {
          super();
          this.x = a;
          this.y = b;
        }
        static create(ctx, a = Float.valueOf(2), b = Float.valueOf(5)) {
          return new A(a, b);
        }
        getX() {
          return this.x;
        }
        calc(ctx, a, b, c, d, e) {
          return a.value + 2*b.value + 3*c.value + 4*d.value + 5*e.value;
        }
      }
      A.create_jel_mapping = {a:1, b:2};
      A.prototype.getX_jel_mapping = {};
      A.prototype.calc_jel_mapping = {a:1,b:2,c:3,d:4,e:5};

      const create = new Callable(A.create, A.create_jel_mapping);
      assert(new JEL('a.getX').executeImmediately(defaultContext.plus({a:new A()})) instanceof Callable);
      jelAssert.equal(new JEL('a.getX()').executeImmediately(defaultContext.plus({a:new A()})), 2);
      const ctx = defaultContext.plus({A: new NativeClass(A)});
      assert(new JEL('A()').executeImmediately(ctx) instanceof A);
      jelAssert.equal(new JEL('A().getX()').executeImmediately(ctx), 2);
      jelAssert.equal(new JEL('A()["getX"]()').executeImmediately(ctx), 2);
      jelAssert.equal(new JEL('A(a=55).getX()').executeImmediately(ctx), 55);
      jelAssert.equal(new JEL('A(55).getX()').executeImmediately(ctx), 55);
      jelAssert.equal(new JEL('A(b=77,a=55).getX()').executeImmediately(ctx), 55);
      jelAssert.equal(new JEL('A().calc(3, 2, 1, 100, 1000)').executeImmediately(ctx), 3+4+3+400+5000);
      jelAssert.equal(new JEL('A().calc(b= 2, c= 1, e= 1000, d= 100, a=3)').executeImmediately(ctx), 3+4+3+400+5000);
      jelAssert.equal(new JEL('A().calc(3, 2, c=1, e=1000, d=100)').executeImmediately(ctx), 3+4+3+400+5000);
      jelAssert.equal(new JEL('A(A(50).getX).getX()()').executeImmediately(ctx), 50);
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
      jelAssert.equal(new JEL('a=>55').executeImmediately(new Context()).invokeWithObject(defaultContext, null, []), 55);
      jelAssert.equal(new JEL('x=>x').executeImmediately(defaultContext).invokeWithObject(defaultContext, null, [Float.valueOf(66)]), 66);
      jelAssert.equal(new JEL('x=>x').executeImmediately(defaultContext).invokeWithObject(defaultContext, Float.valueOf(42), [Float.valueOf(66)]), 66);
      jelAssert.equal(new JEL('x=>x').executeImmediately(defaultContext).invoke(defaultContext, Float.valueOf(66)), null);
      jelAssert.equal(new JEL('x=>x').executeImmediately(defaultContext).invokeWithObject(defaultContext, null, [], new Map(Object.entries({x:Float.valueOf(66)}))), 66);
      jelAssert.equal(new JEL('x=>x').executeImmediately(defaultContext).invokeWithObject(defaultContext, Float.valueOf(42), [], new Map(Object.entries({x:Float.valueOf(66)}))), 66);
      jelAssert.equal(new JEL('(a,b)=>a+b').executeImmediately(defaultContext).invokeWithObject(defaultContext, null, [], new Map(Object.entries({a:Float.valueOf(40),b:Float.valueOf(2)}))), 42);
      jelAssert.equal(new JEL('(a,b)=>a+b').executeImmediately(defaultContext).invokeWithObject(defaultContext, null, [Float.valueOf(40)], new Map(Object.entries({b:Float.valueOf(2)}))), 42);
      jelAssert.equal(new JEL('(a,b)=>b').executeImmediately(defaultContext).invokeWithObject(defaultContext, null, []), null);

      jelAssert.equal(new JEL('()=>this').executeImmediately(defaultContext).invokeWithObject(defaultContext, Float.valueOf(42), []), 42);
      jelAssert.equal(new JEL('(x)=>this+x').executeImmediately(defaultContext).invokeWithObject(defaultContext, Float.valueOf(42), [Float.valueOf(66)]), 108);

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

   it('supports promises', function() {
     class A extends JelObject {
       static promise(ctx, value) {
         return new Promise((resolve)=>setTimeout(()=>resolve(value), 1));
       }

     }
     A.promise_jel_mapping = ['value'];
     A.x = 42;
     A.JEL_PROPERTIES = {x:1};

     const l = [];
     const ctx = new Context().setAll({A: new NativeClass(A)});
     l.push(JEL.execute('A.promise(3)+4', '(unit test)', ctx).then(v=>assert.equal(v, 7)));
     l.push(JEL.execute('3+A.promise(4)', '(unit test)', ctx).then(v=>assert.equal(v, 7)));
     l.push(JEL.execute('A.promise(3)+A.promise(4)', '(unit test)', ctx).then(v=>assert.equal(v, 7)));
     l.push(JEL.execute('A.promise(A.x)+A.promise(A.x)', '(unit test)', ctx).then(v=>assert.equal(v, 84)));
     l.push(JEL.execute('A.promise(A)[A.promise("x")]', '(unit test)', ctx).then(v=>assert.equal(v, 42)));
     l.push(JEL.execute('A.promise(A).promise(A.promise(3))', '(unit test)', ctx).then(v=>assert.equal(v, 3)));
     l.push(JEL.execute('if (!A.promise(0)) then A.promise(4) else 5', '(unit test)', ctx).then(v=>assert.equal(v, 4)));
     l.push(JEL.execute('((a,b,c,d,e)=>a+4*b+5*c+30*d+100*e)(A.promise(2), 5, A.promise(1), d=A.promise(10), e=1)', '(unit test)', ctx).then(v=>assert.equal(v, 427)));

     return Promise.all(l);
   });
  });
});