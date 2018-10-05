'use strict';

require('source-map-support').install();
const assert = require('assert');

const JEL = require('../../build/jel/JEL.js').default;
const FunctionCallable = require('../../build/jel/FunctionCallable.js').default;
const Callable = require('../../build/jel/Callable.js').default;
const Context = require('../../build/jel/Context.js').default;
const JelType = require('../../build/jel/JelType.js').default;
const FuzzyBoolean = require('../../build/jel/types/FuzzyBoolean.js').default;
const JelList = require('../../build/jel/types/List.js').default;
const JelDictionary = require('../../build/jel/types/Dictionary.js').default;
const Fraction = require('../../build/jel/types/Fraction.js').default;
const UnitValue = require('../../build/jel/types/UnitValue.js').default;
const JelNode = require('../../build/jel/expressionNodes/JelNode.js').default;
const Literal = require('../../build/jel/expressionNodes/Literal.js').default;
const Variable = require('../../build/jel/expressionNodes/Variable.js').default;
const Operator = require('../../build/jel/expressionNodes/Operator.js').default;
const List = require('../../build/jel/expressionNodes/List.js').default;
const Reference = require('../../build/jel/expressionNodes/Reference.js').default;
const Condition = require('../../build/jel/expressionNodes/Condition.js').default;
const Assignment = require('../../build/jel/expressionNodes/Assignment.js').default;
const With = require('../../build/jel/expressionNodes/With.js').default;
const Lambda = require('../../build/jel/expressionNodes/Lambda.js').default;
const Call = require('../../build/jel/expressionNodes/Call.js').default;

const {JelAssert, JelPromise, JelConsole} = require('../jel-assert.js');
const jelAssert = new JelAssert();

class MockSession {
	createDbRef(distinctName, params) {
		return {distinctName, params, isDBRef: true};
	}
}

const ctx = new Context(undefined, new MockSession()).setAll({JelPromise, JelConsole, FuzzyBoolean});
jelAssert.setCtx(ctx);

describe('JEL', function() {
  describe('execute()', function() {
    
    it('should execute a simple literal', function() {
      assert.equal(new JEL('5').executeImmediately(), 5);
      assert.equal(new JEL('+5').executeImmediately(), 5);
      assert.equal(new JEL('-5').executeImmediately(), -5);
      assert.equal(new JEL('- 5').executeImmediately(), -5);
      assert.equal(new JEL('1e5').executeImmediately(), 1e5);
      assert.equal(new JEL('-1e-5').executeImmediately(), -1e-5);
      assert.equal(new JEL('"foo"').executeImmediately(), 'foo');
      assert.equal(new JEL('true').executeImmediately().state, 1);
      assert.equal(new JEL('null').executeImmediately(), null);
    });

		it('should execute a simple fractions', function() {
      jelAssert.equal('5/2', new Fraction(5, 2));
      jelAssert.equal('+3/7', new Fraction(3, 7));
      jelAssert.equal('-2/7', new Fraction(-2, 7));
    });

		it('should execute a UnitValues', function() {
      jelAssert.equal('1 @Meter', new UnitValue(1, 'Meter'));
      jelAssert.equal('5.5 @Meter', new UnitValue(5.5, 'Meter'));
      jelAssert.equal('-2 @Second', new UnitValue(-2, 'Second'));
      jelAssert.equal('+3 @Second', new UnitValue(3, 'Second'));
      jelAssert.equal('1/4 @Inch', new UnitValue(new Fraction(1, 4), 'Inch'));
      jelAssert.equal('-3/4 @Mile', new UnitValue(new Fraction(-3, 4), 'Mile'));
      jelAssert.equal('1 @Meter + 1 @Meter', new UnitValue(2, 'Meter'));
    });

		
   it('should execute patterns', function() {
      assert.equal(new JEL('`a b c`').executeImmediately().toString(), 'Pattern(text=`a b c`)');
      assert.equal(new JEL('`a b c`.match("a  b c")').executeImmediately().state, 1);
      assert.equal(new JEL('`a b c`.match("a  c c")').executeImmediately().state, 0);
    });

		it('should support references', function() {
      assert.equal(new JEL('@Hello').executeImmediately(ctx).distinctName, 'Hello');
      assert.equal(new JEL('@Fish(age= 10)').executeImmediately(ctx).distinctName, 'Fish');
      assert.equal(new JEL('@Fish(age= 10)').executeImmediately(ctx).params.get('age'), 10);
    });

    
   it('should execute primitive operations', function() {
      jelAssert.equal('5+5', 10);
      jelAssert.equal('5*5', 25);
      jelAssert.equal('7-5', 2);
      jelAssert.equal('7^2', 49);
      jelAssert.equal('0.5^-1', 2);
      jelAssert.equal('!true', 'false');
      assert.equal(new JEL('-(10/2.0)').executeImmediately(), -5);
      assert.equal(new JEL('"foo"+"bar"').executeImmediately(), "foobar");
      assert.equal(new JEL('5>5').executeImmediately().state, 0);
      assert.equal(new JEL('5<5').executeImmediately().state, 0);
      assert.equal(new JEL('5>=5').executeImmediately().state, 1);
      assert.equal(new JEL('5<=5').executeImmediately().state, 1);
      assert.equal(new JEL('6>=5').executeImmediately().state, 1);
      assert.equal(new JEL('6<=5').executeImmediately().state, 0);
      assert.equal(new JEL('5>=6').executeImmediately().state, 0);
      assert.equal(new JEL('5<=6').executeImmediately().state, 1);
      assert.equal(new JEL('6>5').executeImmediately().state, 1);
      assert.equal(new JEL('6<5').executeImmediately().state, 0);
      assert.equal(new JEL('5>6').executeImmediately().state, 0);
      assert.equal(new JEL('5<6').executeImmediately().state, 1);
      assert.equal(new JEL('5>0').executeImmediately().state, 1);
      assert.equal(new JEL('5<0').executeImmediately().state, 0);
      assert.equal(new JEL('5>=0').executeImmediately().state, 1);
      assert.equal(new JEL('5<=0').executeImmediately().state, 0);
      assert.equal(new JEL('5==5').executeImmediately().state, 1);
      assert.equal(new JEL('6==5').executeImmediately().state, 0);
      assert.equal(new JEL('((-7))+3').executeImmediately(), -4);
    });

    
   it('should support logical OR (||)', function() {
      assert.equal(new JEL('true||false').executeImmediately().state, 1);
      assert.equal(new JEL('true||true').executeImmediately().state, 1);
      assert.equal(new JEL('false||true').executeImmediately().state, 1);
      assert.equal(new JEL('false||false').executeImmediately().state, 0);
      assert.equal(new JEL('17||0').executeImmediately(), 17);
      assert.equal(new JEL('15||"test"').executeImmediately(), 15);
      assert.equal(new JEL('""||"foo"').executeImmediately(), "foo");
      assert.equal(new JEL('0||""').executeImmediately(), 0);
    });

    it('should support logical AND (&&)', function() {
      assert.equal(new JEL('true && false').executeImmediately().state, 0);
      assert.equal(new JEL('true && true').executeImmediately().state, 1);
      assert.equal(new JEL('false && true').executeImmediately().state, 0);
      assert.equal(new JEL('false && false').executeImmediately().state, 0);
      assert.equal(new JEL('17 && 0').executeImmediately(), 0);
      assert.equal(new JEL('15 && "test"').executeImmediately(), "test");
      assert.equal(new JEL('"" && "foo"').executeImmediately(), "");
      assert.equal(new JEL('0 && ""').executeImmediately(), 0);
    });
		
		 it('should support instanceof', function() {
      jelAssert.equal("3 instanceof @Number", "true");
      jelAssert.equal("null instanceof @Number", "false");
      jelAssert.equal("'hello' instanceof @Number", "false");
      jelAssert.equal("true instanceof @Number", "false");
      jelAssert.equal("3 instanceof @String", "false");
      jelAssert.equal("null instanceof @String", "false");
      jelAssert.equal("'hello' instanceof @String", "true");
      jelAssert.equal("true instanceof @String", "false");
      jelAssert.equal("3 instanceof @FuzzyBoolean", "false");
      jelAssert.equal("'hello' instanceof @FuzzyBoolean", "false");
      jelAssert.equal("true instanceof @FuzzyBoolean", "true");
    });

    it('should access member fields of JelTypes', function() {
      class A extends JelType {
        constructor() {
          super();
          this.x = 3;
          this.y = "foo";
        }
      }
      A.prototype.JEL_PROPERTIES = {x:1,y:1};
      
      assert.equal(new JEL('a.x').executeImmediately(new Context().setAll({a:new A()})), 3);
      assert.equal(new JEL('(a).y').executeImmediately(new Context().setAll({a:new A()})), "foo");
      assert.equal(new JEL('(a)["y"]').executeImmediately(new Context().setAll({a:new A()})), "foo");
      assert.throws(()=>new JEL('(a).z').executeImmediately(new Context().setAll({a:new A()})));
      assert.throws(()=>new JEL('(a) . 5').executeImmediately(new Context().setAll({a:new A()})));
      assert.throws(()=>new JEL('(a)."x"').executeImmediately(new Context().setAll({a:new A()})));
      
      class B extends JelType {
        constructor(ref) {
          super();
          this.ref = ref;
        }
      }
      B.prototype.JEL_PROPERTIES = {ref:1};
      
      assert.equal(new JEL('b.ref').executeImmediately(new Context().setAll({b: new B(5)})), 5);
      assert.equal(new JEL('b.ref.ref.ref').executeImmediately(new Context().setAll({b: new B(new B(new B(7)))})), 7);
   });

   it('should access methods of JelTypes', function() {
      class A extends JelType {
        constructor(a = 2, b = 5) {
          super();
          this.x = a;
          this.y = b;
        }
        static create(ctx, a, b) {
          return new A(a, b);
        }
        getX() {
          return this.x;
        }
        calc(ctx, a, b, c, d, e) {
          return a + 2*b + 3*c + 4*d + 5*e;
        }
      }
      A.create_jel_mapping = {a:1, b:2};
      A.prototype.getX_jel_mapping = {};
      A.prototype.calc_jel_mapping = {a:1,b:2,c:3,d:4,e:5};
     
      const create = new Callable(A.create, A.create_jel_mapping);
      assert(new JEL('a.getX').executeImmediately(new Context().setAll({a:new A()})) instanceof Callable);
      assert.equal(new JEL('a.getX()').executeImmediately(new Context().setAll({a:new A()})), 2);
      assert(new JEL('A()').executeImmediately(new Context().setAll({A})) instanceof A);
      assert.equal(new JEL('A().getX()').executeImmediately(new Context().setAll({A})), 2);
      assert.equal(new JEL('A()["getX"]()').executeImmediately(new Context().setAll({A})), 2);
      assert.equal(new JEL('A(a=55).getX()').executeImmediately(new Context().setAll({A})), 55);
      assert.equal(new JEL('A(55).getX()').executeImmediately(new Context().setAll({A})), 55);
      assert.equal(new JEL('A(b=77,a=55).getX()').executeImmediately(new Context().setAll({A})), 55);
      assert.equal(new JEL('A().calc(3, 2, 1, 100, 1000)').executeImmediately(new Context().setAll({A})), 3+4+3+400+5000);
      assert.equal(new JEL('A().calc(b= 2, c= 1, e= 1000, d= 100, a=3)').executeImmediately(new Context().setAll({A})), 3+4+3+400+5000);
      assert.equal(new JEL('A().calc(3, 2, c=1, e=1000, d=100)').executeImmediately(new Context().setAll({A})), 3+4+3+400+5000);
    });

   it('should access properties of built-ins', function() {
     assert.equal(new JEL('"foobar".length').executeImmediately(), 6);
   });

   it('should access methods of built-ins', function() {
     assert.equal(new JEL('" foobar   ".trim()').executeImmediately(), "foobar");
   });

    
   it('should access variables', function() {
     assert.equal(new JEL('a').executeImmediately(new Context().setAll({a: 10})), 10);
     assert.equal(new JEL('a+b').executeImmediately(new Context().setAll({a: 1, b: 3})), 4);
    });
    
    
   it('supports conditions', function() {
      assert.equal(new JEL('if true then 1 else 2').executeImmediately(), 1);
      assert.equal(new JEL('if false then 1 else 2').executeImmediately(), 2);
      assert.equal(new JEL('if 8 then 1 else 2').executeImmediately(), 1);
      assert.equal(new JEL('if 0 then 1 else 2').executeImmediately(), 2);
      assert.equal(new JEL('if "j" then 1 else 2').executeImmediately(), 1);
      assert.equal(new JEL('if "" then 1 else 2').executeImmediately(), 2);
      assert.equal(new JEL("if 2>1 then 'foo' else 'bar'").executeImmediately(), "foo");
      assert.equal(new JEL("if 2<1 then 'foo' else 'bar'").executeImmediately(), "bar");
      assert.equal(new JEL("if 2<1 then 'foo' else if 3>2 then 2 else 1").executeImmediately(), 2);
      assert.equal(new JEL("if 2>1 then (if 3<2 then 2 else 1) else 6").executeImmediately(), 1);

      assert.equal(new JEL('if true then 7').executeImmediately(), 7);
      assert.equal(new JEL('if false then 7').executeImmediately().state, 1);
    });

    it('supports lists', function() {
      assert(new JEL('[]').executeImmediately() instanceof JelList);
      assert.deepEqual(new JEL('[]').executeImmediately().elements, []);
      assert.deepEqual(new JEL('[1]').executeImmediately().elements, [1]);
      assert.deepEqual(new JEL('[7, 9-4, 7*3]').executeImmediately().elements, [7, 5, 21]);
      
			return new JEL('[JelPromise(2), 0, JelPromise.resolve(8), JelPromise(9), JelPromise.resolve(7), 5]').execute(ctx).then(r=> assert.deepEqual(r.elements, [2, 0, 8, 9, 7, 5]));
    });

    it('supports dictionaries', function() {
      assert.deepEqual(new JEL('{}').executeImmediately().toObjectDebug(), {});
      assert.deepEqual(new JEL('{a: 3, b: 1}').executeImmediately().toObjectDebug(), {a: 3, b: 1});
      assert.deepEqual(new JEL('{"a": 3, "b": 1}').executeImmediately().toObjectDebug(), {a: 3, b: 1});
      assert.deepEqual(new JEL("{'a': 3, 'b': 1}").executeImmediately().toObjectDebug(), {a: 3, b: 1});
      assert.deepEqual(new JEL('{a, b: 1, c}').executeImmediately(new Context().setAll({a:7,b:2,c:10})).toObjectDebug(), {a:7,b:1,c:10});
      assert.deepEqual(new JEL('{a: {b: 2}}').executeImmediately().toObjectDebug().a.toObjectDebug().b, 2);
      
      assert.throws(()=>new JEL('{a: 1, a: 2}').executeImmediately());

      return new JEL("{a: JelPromise(1), b: 2, c: JelPromise(3), d: JelPromise.resolve(6)}").execute(ctx).then(r=>assert.deepEqual(r.toObjectDebug(), {a: 1, b: 2, c: 3, d: 6}));
		});


    it('supports translators', function() {
      assert.equal(new JEL('${}').executeImmediately().toString(), "Translator(TranslatorNode(tokens={}))");
      assert.equal(new JEL('${`abc` => 2}').executeImmediately().toString(), "Translator(TranslatorNode(tokens={abc: TranslatorNode(tokens={} results=[LambdaResultNode(2)])}))");
      assert.equal(new JEL('${`abc def` => 7}').executeImmediately().toString(), "Translator(TranslatorNode(tokens={abc: TranslatorNode(tokens={def: TranslatorNode(tokens={} results=[LambdaResultNode(7)])})}))");
      
      assert.equal(new JEL('${`abc` => 2, `foo` => 6}').executeImmediately().toString(), "Translator(TranslatorNode(tokens={abc: TranslatorNode(tokens={} results=[LambdaResultNode(2)]),\nfoo: TranslatorNode(tokens={} results=[LambdaResultNode(6)])}))");
      assert.equal(new JEL('${`abc def` => 2, `foo` => 6}').executeImmediately().toString(), "Translator(TranslatorNode(tokens={abc: TranslatorNode(tokens={def: TranslatorNode(tokens={} results=[LambdaResultNode(2)])}),\nfoo: TranslatorNode(tokens={} results=[LambdaResultNode(6)])}))");
      assert.equal(new JEL('${`abc def` => 2, `foo` => 6, `abc foo bar` => 4}').executeImmediately().toString(), "Translator(TranslatorNode(tokens={abc: TranslatorNode(tokens={def: TranslatorNode(tokens={} results=[LambdaResultNode(2)]),\nfoo: TranslatorNode(tokens={bar: TranslatorNode(tokens={} results=[LambdaResultNode(4)])})}),\nfoo: TranslatorNode(tokens={} results=[LambdaResultNode(6)])}))");
    
      assert.equal(new JEL('${x: `abc` => 2}').executeImmediately().toString(), "Translator(TranslatorNode(tokens={abc: TranslatorNode(tokens={} results=[LambdaResultNode(2, meta={x=FuzzyBoolean(1)})])}))");
      assert.equal(new JEL('${x,y,z: `abc` => 2}').executeImmediately().toString(), "Translator(TranslatorNode(tokens={abc: TranslatorNode(tokens={} results=[LambdaResultNode(2, meta={x=FuzzyBoolean(1), y=FuzzyBoolean(1), z=FuzzyBoolean(1)})])}))");
      assert.equal(new JEL('${x,y=1,zzz="bla": `abc` => 2}').executeImmediately().toString(), "Translator(TranslatorNode(tokens={abc: TranslatorNode(tokens={} results=[LambdaResultNode(2, meta={x=FuzzyBoolean(1), y=1, zzz=bla})])}))");

      assert.equal(new JEL('${}.match("").length').executeImmediately(), 0);
      assert.equal(new JEL('${}.match("a").length').executeImmediately(), 0);

      assert.equal(new JEL('${`abc` => 2}.match("abc")[0].value').executeImmediately(), 2);
      assert.equal(new JEL('${`a b c` => 2, `a` => 1}.match("a")[0].value').executeImmediately(), 1);
    });
    
    it('supports the get operator for dictionaries', function() {
      assert.strictEqual(new JEL('{}["a"]').executeImmediately(), undefined);
      assert.strictEqual(new JEL('{a:3}["a"]').executeImmediately(), 3);
    });

    it('supports the get operator for lists', function() {
      assert.strictEqual(new JEL('[][0]').executeImmediately(), undefined);
      assert.strictEqual(new JEL('[1, 2, 3][10]').executeImmediately(), undefined);
      assert.strictEqual(new JEL('[1, 2, 3][-1]').executeImmediately(), undefined);
      assert.strictEqual(new JEL('[1, 2, 3, 4][2]').executeImmediately(), 3);
    });

    it('supports with', function() {
      assert.equal(new JEL('with a=1: a').executeImmediately(), 1);
      assert.equal(new JEL('with a=1, b=2: a+b').executeImmediately(), 3);
      assert.deepEqual(new JEL('with a=1, b=a+1, c=b*3, d=c*4, e=d/6: [a,b,c,d,e]').executeImmediately().elements, [1,2,6,24,4]);
    });

    
   it('supports calls', function() {
      function f(ctx, a=1, b=2) { 
        return a + b + (this && this.c || 5);
      }
      const fc1 = new FunctionCallable(f, {a:1, b:2}, {c:7});
      const fc2 = new FunctionCallable(f, {a:1, b:2});
      assert.equal(new JEL('f()').executeImmediately(new Context().setAll({f:fc1})), 10);
      assert.equal(new JEL('f()').executeImmediately(new Context().setAll({f:fc2})), 8);
      assert.equal(new JEL('f(10)').executeImmediately(new Context().setAll({f:fc1})), 19);
      assert.equal(new JEL('f(10, 100)').executeImmediately(new Context().setAll({f:fc1})), 117);
      assert.equal(new JEL('f(10, 100, 1000)').executeImmediately(new Context().setAll({f:fc1})), 117);
      assert.equal(new JEL('f(b=100, a=10)').executeImmediately(new Context().setAll({f:fc1})), 117);
      assert.equal(new JEL('f(b=100)').executeImmediately(new Context().setAll({f:fc1})), 108);
      assert.equal(new JEL('f(10, b=100)').executeImmediately(new Context().setAll({f:fc1})), 117);
      assert.equal(new JEL('f(10, b=100)').executeImmediately(new Context().setAll({f:fc2})), 115);
   });
    
   it('supports constructors and static methods', function() {
      class A extends JelType {
        constructor(a = 2, b = 5) {
          super();
          this.x = a;
          this.y = b;
        }
        static create(ctx, a, b) {
          return new A(a, b);
        }
        static pic() {
          return 3;
        }
        static add2(ctx, a = 3, b = 7) {
          return a + 2*b;
        }
      }
      A.create_jel_mapping = {a:1, b:2};
      A.pic_jel_mapping = [];
      A.add2_jel_mapping = ['a','b'];
     
      assert.equal(new JEL('A()').executeImmediately(new Context().setAll({A})).x, 2);
      assert.equal(new JEL('A()').executeImmediately(new Context().setAll({A})).y, 5);
      assert.equal(new JEL('A(7,8)').executeImmediately(new Context().setAll({A})).x, 7);
      assert.equal(new JEL('A(7,8)').executeImmediately(new Context().setAll({A})).y, 8);
      assert.equal(new JEL('A(b=9,a=3)').executeImmediately(new Context().setAll({A})).x, 3);
      assert.equal(new JEL('A(b=9,a=3)').executeImmediately(new Context().setAll({A})).y, 9);
      assert.equal(new JEL('A(3, b=1)').executeImmediately(new Context().setAll({A})).x, 3);
      assert.equal(new JEL('A(3, b=1)').executeImmediately(new Context().setAll({A})).y, 1);
      assert.equal(new JEL('A(b=1)').executeImmediately(new Context().setAll({A})).x, 2);
      assert.equal(new JEL('A(b=1)').executeImmediately(new Context().setAll({A})).y, 1);

      assert.equal(new JEL('A.pic()').executeImmediately(new Context().setAll({A})), 3);

      assert.equal(new JEL('A.add2()').executeImmediately(new Context().setAll({A})), 17);
      assert.equal(new JEL('A.add2(1)').executeImmediately(new Context().setAll({A})), 15);
      assert.equal(new JEL('A.add2(5, 2)').executeImmediately(new Context().setAll({A})), 9);
      assert.equal(new JEL('A.add2(b=1)').executeImmediately(new Context().setAll({A})), 5);
      assert.equal(new JEL('A.add2(6)').executeImmediately(new Context().setAll({A})), 20);
   });

   it('supports named-argument only calls', function() {
      class A extends JelType {
        constructor() {
          super();
        }
        static add2(ctx, {a = 3, b = 7, c = 5} = {}) {
          return a + 10*b + 100*c;
        }
      }
      A.add2_jel_mapping = 'named';
     
      assert.equal(new JEL('A.add2()').executeImmediately(new Context().setAll({A})), 573);
      assert.equal(new JEL('A.add2(a=1, b=2, c=3)').executeImmediately(new Context().setAll({A})), 321);
      assert.equal(new JEL('A.add2(c=7)').executeImmediately(new Context().setAll({A})), 773);
      assert.equal(new JEL('A.add2(c=7, a=5)').executeImmediately(new Context().setAll({A})), 775);
      return new JEL('A.add2(1, 2, 3)').execute(new Context().setAll({A})).then(()=>assert.fail('Should get error'), ()=>1);
   });

    
   it('supports lambda', function() {
      assert(new JEL('a=>1').executeImmediately(new Context()) instanceof Callable);
      assert.equal(new JEL('a=>55').executeImmediately(new Context()).invokeWithObject(new Context(), []), 55);
      assert.equal(new JEL('x=>x').executeImmediately(new Context()).invokeWithObject(new Context(), [66]), 66);
      assert.equal(new JEL('x=>x').executeImmediately(new Context()).invokeWithObject(new Context(), [66]), 66);
      assert.equal(new JEL('x=>x').executeImmediately(new Context()).invoke(new Context(), 66), 66);
      assert.equal(new JEL('x=>x').executeImmediately(new Context()).invokeWithObject(new Context(), [], {x:66}), 66);
      assert.equal(new JEL('(a,b)=>a+b').executeImmediately(new Context()).invokeWithObject(new Context(), [], {a:40,b:2}), 42);
      assert.equal(new JEL('(a,b)=>a+b').executeImmediately(new Context()).invokeWithObject(new Context(), [40], {b:2}), 42);
      assert.equal(new JEL('(a,b)=>b').executeImmediately(new Context()).invokeWithObject(new Context(), []), null);

      assert.equal(new JEL('(x=>x)(66)').executeImmediately(new Context()), 66);
      assert.equal(new JEL('(x=>x)(x=66)').executeImmediately(new Context()), 66);
      assert.equal(new JEL('((a,b)=>a+b)(20, 22)').executeImmediately(new Context()), 42);
      assert.equal(new JEL('((a,b)=>a+b)(b=20, a=22)').executeImmediately(new Context()), 42);
   });
    
   it('supports promises', function() {
     class A extends JelType {
       static promise(ctx, value) {
         return new Promise((resolve)=>setTimeout(()=>resolve(value), 1));
       }
      
     }
     A.promise_jel_mapping = ['value'];
     A.x = 42;
     A.JEL_PROPERTIES = {x:1};

     const l = [];
     l.push(JEL.execute('A.promise(3)+4', new Context().setAll({A})).then(v=>assert.equal(v, 7)));
     l.push(JEL.execute('3+A.promise(4)', new Context().setAll({A})).then(v=>assert.equal(v, 7)));
     l.push(JEL.execute('A.promise(3)+A.promise(4)', new Context().setAll({A})).then(v=>assert.equal(v, 7)));
     l.push(JEL.execute('A.promise(A.x)+A.promise(A.x)', new Context().setAll({A})).then(v=>assert.equal(v, 84)));
     l.push(JEL.execute('A.promise(A)[A.promise("x")]', new Context().setAll({A})).then(v=>assert.equal(v, 42)));
     l.push(JEL.execute('A.promise(A).promise(A.promise(3))', new Context().setAll({A})).then(v=>assert.equal(v, 3)));
     l.push(JEL.execute('if (!A.promise(0)) then A.promise(4) else 5', new Context().setAll({A})).then(v=>assert.equal(v, 4)));
     l.push(JEL.execute('((a,b,c,d,e)=>a+4*b+5*c+30*d+100*e)(A.promise(2), 5, A.promise(1), d=A.promise(10), e=1)', new Context().setAll({A})).then(v=>assert.equal(v, 427)));

     return Promise.all(l);
   });

    
    
  });
});

