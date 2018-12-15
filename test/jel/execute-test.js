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

const {JelAssert, JelPromise, JelConsole, MockSession, PromiseType} = require('../jel-assert.js');
const jelAssert = new JelAssert();


const ctx = DefaultContext.plus(new MockSession()).plus({JelPromise: new NativeClass(JelPromise), JelConsole: new NativeClass(JelConsole), PromiseType: new NativeClass(PromiseType)});
jelAssert.setCtx(ctx);

describe('JEL', function() {
  describe('execute()', function() {
    
    it('should execute a simple literal', function() {
      jelAssert.equal(new JEL('5').executeImmediately(), Float.valueOf(5));
      jelAssert.equal(new JEL('+5').executeImmediately(), Float.valueOf(5));
      jelAssert.equal(new JEL('-5').executeImmediately(), Float.valueOf(-5));
      jelAssert.equal(new JEL('- 5').executeImmediately(), Float.valueOf(-5));
      jelAssert.equal(new JEL('1e5').executeImmediately(), Float.valueOf(1e5));
      jelAssert.equal(new JEL('-1e-5').executeImmediately(), Float.valueOf(-1e-5));
      jelAssert.equal(new JEL('"foo"').executeImmediately(), JelString.valueOf('foo'));
      assert.equal(new JEL('true').executeImmediately().state, 1);
      assert.equal(new JEL('null').executeImmediately(), null);
    });

		it('should execute a simple fractions', function() {
      jelAssert.equal('5/2', new Fraction(5, 2));
      jelAssert.equal('+3/7', new Fraction(3, 7));
      jelAssert.equal('-2/7', new Fraction(-2, 7));
    });

		it('should execute a UnitValues', function() {
      jelAssert.equal('1 @Meter', new UnitValue(Float.valueOf(1), 'Meter'));
      jelAssert.equal('5.5 @Meter', new UnitValue(Float.valueOf(5.5), 'Meter'));
      jelAssert.equal('-2 @Second', new UnitValue(Float.valueOf(-2), 'Second'));
      jelAssert.equal('+3 @Second', new UnitValue(Float.valueOf(3), 'Second'));
      jelAssert.equal('1/4 @Inch', new UnitValue(new Fraction(1, 4), 'Inch'));
      jelAssert.equal('-3/4 @Mile', new UnitValue(new Fraction(-3, 4), 'Mile'));
      jelAssert.equal('1 @Meter + 1 @Meter', new UnitValue(Float.valueOf(2), 'Meter'));
    });

		
   it('should execute patterns', function() {
      assert.equal(new JEL('`a b c`').executeImmediately().constructor.name, 'Pattern');
      assert.equal(new JEL('`a b c`').executeImmediately().toString(), '`a b c`');
      assert.equal(new JEL('`a b c`.match("a  b c")').executeImmediately().state, 1);
      assert.equal(new JEL('`a b c`.match("a  c c")').executeImmediately().state, 0);
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

    
   it('should execute primitive operations', function() {
      jelAssert.equal('5+5', 10);
      jelAssert.equal('5*5', 25);
      jelAssert.equal('7-5', 2);
      jelAssert.equal('7^2', 49);
      jelAssert.equal('0.5^-1', 2);
      jelAssert.equal('(-0.5).abs()', 0.5);
      jelAssert.equal('!true', 'false');
      jelAssert.equal(new JEL('-(10/2.0)').executeImmediately(), -5);
      jelAssert.equal(new JEL('"foo"+"bar"').executeImmediately(), "'foobar'");
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
      jelAssert.equal(new JEL('((-7))+3').executeImmediately(), -4);
    });

    
   it('should support logical OR (||)', function() {
      assert.equal(new JEL('true||false').executeImmediately().state, 1);
      assert.equal(new JEL('true||true').executeImmediately().state, 1);
      assert.equal(new JEL('false||true').executeImmediately().state, 1);
      assert.equal(new JEL('false||false').executeImmediately().state, 0);
      jelAssert.equal(new JEL('17||0').executeImmediately(), 17);
      jelAssert.equal(new JEL('15||"test"').executeImmediately(), 15);
      jelAssert.equal(new JEL('""||"foo"').executeImmediately(), "'foo'");
      jelAssert.equal(new JEL('0||1').executeImmediately(), 1);
      jelAssert.equal(new JEL('0||""').executeImmediately(), "''");
    });

    it('should support logical AND (&&)', function() {
      assert.equal(new JEL('true && false').executeImmediately().state, 0);
      assert.equal(new JEL('true && true').executeImmediately().state, 1);
      assert.equal(new JEL('false && true').executeImmediately().state, 0);
      assert.equal(new JEL('false && false').executeImmediately().state, 0);
      jelAssert.equal(new JEL('17 && 0').executeImmediately(), 0);
      jelAssert.equal(new JEL('15 && "test"').executeImmediately(), "'test'");
      jelAssert.equal(new JEL('"" && "foo"').executeImmediately(), "''");
      jelAssert.equal(new JEL('0 && ""').executeImmediately(), 0);
      jelAssert.equal(new JEL('1 && ""').executeImmediately(), "''");
      jelAssert.equal(new JEL('1 && 2').executeImmediately(), 2);
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
     });

 		 it('should support as', function() {
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
      return jelAssert.errorPromise("true as String|Float");
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
      assert(new JEL('a.getX').executeImmediately(DefaultContext.plus({a:new A()})) instanceof Callable);
      jelAssert.equal(new JEL('a.getX()').executeImmediately(DefaultContext.plus({a:new A()})), 2);
      const ctx = DefaultContext.plus({A: new NativeClass(A)});
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

   it('should access properties of built-ins', function() {
     jelAssert.equal(new JEL('"foobar".length').executeImmediately(), 6);
   });

   it('should access methods of built-ins', function() {
     jelAssert.equal(new JEL('" foobar   ".trim()').executeImmediately(), "'foobar'");
   });

    
   it('should access variables', function() {
     jelAssert.equal(new JEL('a').executeImmediately(new Context().setAll({a: Float.valueOf(10)})), 10);
     jelAssert.equal(new JEL('a+b').executeImmediately(new Context().setAll({a: Float.valueOf(1), b: Float.valueOf(3)})), 4);
    });
    
    
   it('supports conditions', function() {
      jelAssert.equal(new JEL('if true then 1 else 2').executeImmediately(), 1);
      jelAssert.equal(new JEL('if false then 1 else 2').executeImmediately(), 2);
      jelAssert.equal(new JEL('if 8 then 1 else 2').executeImmediately(), 1);
      jelAssert.equal(new JEL('if 0 then 1 else 2').executeImmediately(), 2);
      jelAssert.equal(new JEL('if "j" then 1 else 2').executeImmediately(), 1);
      jelAssert.equal(new JEL('if "" then 1 else 2').executeImmediately(), 2);
      jelAssert.equal(new JEL("if 2>1 then 'foo' else 'bar'").executeImmediately(), "'foo'");
      jelAssert.equal(new JEL("if 2<1 then 'foo' else 'bar'").executeImmediately(), "'bar'");
      jelAssert.equal(new JEL("if 2<1 then 'foo' else if 3>2 then 2 else 1").executeImmediately(), 2);
      jelAssert.equal(new JEL("if 2>1 then (if 3<2 then 2 else 1) else 6").executeImmediately(), 1);

      jelAssert.equal(new JEL('if true then 7').executeImmediately(), 7);
      assert.equal(new JEL('if false then 7').executeImmediately().state, 1);
    });

    it('supports lists using the regular syntax []', function() {
      assert(new JEL('[]').executeImmediately() instanceof JelList);
      assert.deepEqual(new JEL('[]').executeImmediately().elements, []);
      assert.deepEqual(new JEL('[1]').executeImmediately().elements, [Float.valueOf(1)]);
      assert.deepEqual(new JEL('[7, 9-4, 7*3]').executeImmediately().elements, [7, 5, 21].map(Float.valueOf));
      
			return new JEL('[JelPromise(2), 0, JelPromise.resolve(8), JelPromise(9), JelPromise.resolve(7), 5]').execute(ctx).then(r=> assert.deepEqual(r.elements, [2, 0, 8, 9, 7, 5].map(Float.valueOf)));
    });
    
    it('supports dictionaries', function() {
      assert.deepEqual(new JEL('{}').executeImmediately().toObjectDebug(), {});
      assert.deepEqual(new JEL('{a: 3, b: 1}').executeImmediately().toObjectDebug(), {a: Float.valueOf(3), b: Float.valueOf(1)});
      assert.deepEqual(new JEL('{"a": 3, "b": 1}').executeImmediately().toObjectDebug(), {a: Float.valueOf(3), b: Float.valueOf(1)});
      assert.deepEqual(new JEL("{'a': 3, 'b': 1}").executeImmediately().toObjectDebug(), {a: Float.valueOf(3), b: Float.valueOf(1)});
      assert.deepEqual(new JEL('{a, b: 1, c}').executeImmediately(new Context().setAll({a:Float.valueOf(7),b:Float.valueOf(2),c:Float.valueOf(10)})).toObjectDebug(), {a:Float.valueOf(7),b:Float.valueOf(1),c:Float.valueOf(10)});
      assert.deepEqual(new JEL('{a: {b: 2}}').executeImmediately().toObjectDebug().a.toObjectDebug().b.value, 2);
      
      assert.throws(()=>new JEL('{a: 1, a: 2}').executeImmediately());

      return new JEL("{a: JelPromise(1), b: 2, c: JelPromise(3), d: JelPromise.resolve(6)}").execute(ctx).then(r=>assert.deepEqual(r.toObjectDebug(), {a: Float.valueOf(1), b: Float.valueOf(2), c: Float.valueOf(3), d: Float.valueOf(6)}));
		});


    it('supports translators', function() {
      assert.equal(new JEL('${}').executeImmediately().toString(), "Translator(TranslatorNode(tokens={}))");
      assert.equal(new JEL('${`abc` => 2}').executeImmediately().toString(), "Translator(TranslatorNode(tokens={abc: TranslatorNode(tokens={} results=[LambdaResultNode(2)])}))");
      assert.equal(new JEL('${`abc def` => 7}').executeImmediately().toString(), "Translator(TranslatorNode(tokens={abc: TranslatorNode(tokens={def: TranslatorNode(tokens={} results=[LambdaResultNode(7)])})}))");
      
      assert.equal(new JEL('${`abc` => 2, `foo` => 6}').executeImmediately().toString(), "Translator(TranslatorNode(tokens={abc: TranslatorNode(tokens={} results=[LambdaResultNode(2)]),\nfoo: TranslatorNode(tokens={} results=[LambdaResultNode(6)])}))");
      assert.equal(new JEL('${`abc def` => 2, `foo` => 6}').executeImmediately().toString(), "Translator(TranslatorNode(tokens={abc: TranslatorNode(tokens={def: TranslatorNode(tokens={} results=[LambdaResultNode(2)])}),\nfoo: TranslatorNode(tokens={} results=[LambdaResultNode(6)])}))");
      assert.equal(new JEL('${`abc def` => 2, `foo` => 6, `abc foo bar` => 4}').executeImmediately().toString(), "Translator(TranslatorNode(tokens={abc: TranslatorNode(tokens={def: TranslatorNode(tokens={} results=[LambdaResultNode(2)]),\nfoo: TranslatorNode(tokens={bar: TranslatorNode(tokens={} results=[LambdaResultNode(4)])})}),\nfoo: TranslatorNode(tokens={} results=[LambdaResultNode(6)])}))");
    
      assert.equal(new JEL('${x: `abc` => 2}').executeImmediately().toString(), "Translator(TranslatorNode(tokens={abc: TranslatorNode(tokens={} results=[LambdaResultNode(2, meta={x=true})])}))");
      assert.equal(new JEL('${x,y,z: `abc` => 2}').executeImmediately().toString(), "Translator(TranslatorNode(tokens={abc: TranslatorNode(tokens={} results=[LambdaResultNode(2, meta={x=true, y=true, z=true})])}))");
      assert.equal(new JEL('${x,y=1,zzz="bla": `abc` => 2}').executeImmediately().toString(), "Translator(TranslatorNode(tokens={abc: TranslatorNode(tokens={} results=[LambdaResultNode(2, meta={x=true, y=1, zzz=\"bla\"})])}))");

      assert.equal(new JEL('${}.match("").length').executeImmediately(), 0);
      assert.equal(new JEL('${}.match("a").length').executeImmediately(), 0);

      assert.equal(new JEL('${`abc` => 2}.match("abc")[0].value').executeImmediately(), 2);
      assert.equal(new JEL('${`a b c` => 2, `a` => 1}.match("a")[0].value').executeImmediately(), 1);
    });
    
    it('supports the get operator for dictionaries', function() {
      assert.strictEqual(new JEL('{}["a"]').executeImmediately(), null);
      jelAssert.equal(new JEL('{a:3}["a"]').executeImmediately(), 3);
    });

    it('supports the get operator for lists', function() {
      assert.strictEqual(new JEL('[][0]').executeImmediately(), null);
      assert.strictEqual(new JEL('[1, 2, 3][10]').executeImmediately(), null);
      assert.strictEqual(new JEL('[1, 2, 3][-1]').executeImmediately(), null);
      jelAssert.equal(new JEL('[1, 2, 3, 4][2]').executeImmediately(), 3);
    });

    it('supports with', function() {
      jelAssert.equal(new JEL('with a=1: a').executeImmediately(), 1);
      jelAssert.equal(new JEL('with a=1, b=2: a+b').executeImmediately(), 3);
      jelAssert.equal(new JEL('with a=1, b=a+1, c=b*3, d=c*4, e=d/6: [a,b,c,d,e]').executeImmediately().elements, "[1,2,6,24,4]");
      jelAssert.equal(new JEL('3+(with a=1: a)+10').executeImmediately(), 14);
      jelAssert.equal(new JEL('3+(with a=1: a)*10').executeImmediately(), 13);
      jelAssert.equal(new JEL('3+2*with a=1: a*10').executeImmediately(), 23);
    });

    
   it('supports calls', function() {
      function f(ctx, a=Float.valueOf(1), b=Float.valueOf(2)) { 
        return a.value + b.value + (this && this.c.value || 5);
      }
      const fc1 = new FunctionCallable(f, {a:Float.valueOf(1), b:Float.valueOf(2)}, {c:Float.valueOf(7)});
      const fc2 = new FunctionCallable(f, {a:Float.valueOf(1), b:Float.valueOf(2)});
      jelAssert.equal(new JEL('f()').executeImmediately(new Context().setAll({f:fc1})), 10);
      jelAssert.equal(new JEL('f()').executeImmediately(new Context().setAll({f:fc2})), 8);
      jelAssert.equal(new JEL('f(10)').executeImmediately(new Context().setAll({f:fc1})), 19);
      jelAssert.equal(new JEL('f(10, 100)').executeImmediately(new Context().setAll({f:fc1})), 117);
      jelAssert.equal(new JEL('f(10, 100, 1000)').executeImmediately(new Context().setAll({f:fc1})), 117);
      jelAssert.equal(new JEL('f(b=100, a=10)').executeImmediately(new Context().setAll({f:fc1})), 117);
      jelAssert.equal(new JEL('f(b=100)').executeImmediately(new Context().setAll({f:fc1})), 108);
      jelAssert.equal(new JEL('f(10, b=100)').executeImmediately(new Context().setAll({f:fc1})), 117);
      jelAssert.equal(new JEL('f(10, b=100)').executeImmediately(new Context().setAll({f:fc2})), 115);
   });
    
   it('supports constructors and static methods', function() {
      class A extends JelObject {
        constructor(a = Float.valueOf(2), b = Float.valueOf(5)) {
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
        static add2(ctx, a = Float.valueOf(3), b = Float.valueOf(7)) {
          return a.value + 2*b.value;
        }
      }
      A.create_jel_mapping = {a:1, b:2};
      A.pic_jel_mapping = [];
      A.add2_jel_mapping = ['a','b'];
     
      const ctx = new Context().setAll({A: new NativeClass(A)});
      assert.equal(new JEL('A()').executeImmediately(ctx).x, 2);
      assert.equal(new JEL('A()').executeImmediately(ctx).y, 5);
      assert.equal(new JEL('A(7,8)').executeImmediately(ctx).x, 7);
      assert.equal(new JEL('A(7,8)').executeImmediately(ctx).y, 8);
      assert.equal(new JEL('A(b=9,a=3)').executeImmediately(ctx).x, 3);
      assert.equal(new JEL('A(b=9,a=3)').executeImmediately(ctx).y, 9);
      assert.equal(new JEL('A(3, b=1)').executeImmediately(ctx).x, 3);
      assert.equal(new JEL('A(3, b=1)').executeImmediately(ctx).y, 1);
      assert.equal(new JEL('A(b=1)').executeImmediately(ctx).x, 2);
      assert.equal(new JEL('A(b=1)').executeImmediately(ctx).y, 1);

      assert.equal(new JEL('A.pic()').executeImmediately(ctx), 3);

      assert.equal(new JEL('A.add2()').executeImmediately(ctx), 17);
      assert.equal(new JEL('A.add2(1)').executeImmediately(ctx), 15);
      assert.equal(new JEL('A.add2(5, 2)').executeImmediately(ctx), 9);
      assert.equal(new JEL('A.add2(b=1)').executeImmediately(ctx), 5);
      assert.equal(new JEL('A.add2(6)').executeImmediately(ctx), 20);
   });
  
   it('supports lambda', function() {
      assert(new JEL('a=>1').executeImmediately(new Context()) instanceof Callable);
      jelAssert.equal(new JEL('a=>55').executeImmediately(new Context()).invokeWithObject(DefaultContext.get(), null, []), 55);
      jelAssert.equal(new JEL('x=>x').executeImmediately(DefaultContext.get()).invokeWithObject(DefaultContext.get(), null, [Float.valueOf(66)]), 66);
      jelAssert.equal(new JEL('x=>x').executeImmediately(DefaultContext.get()).invokeWithObject(DefaultContext.get(), Float.valueOf(42), [Float.valueOf(66)]), 66);
      jelAssert.equal(new JEL('x=>x').executeImmediately(DefaultContext.get()).invoke(DefaultContext.get(), Float.valueOf(66)), null);
      jelAssert.equal(new JEL('x=>x').executeImmediately(DefaultContext.get()).invokeWithObject(DefaultContext.get(), null, [], new Map(Object.entries({x:Float.valueOf(66)}))), 66);
      jelAssert.equal(new JEL('x=>x').executeImmediately(DefaultContext.get()).invokeWithObject(DefaultContext.get(), Float.valueOf(42), [], new Map(Object.entries({x:Float.valueOf(66)}))), 66);
      jelAssert.equal(new JEL('(a,b)=>a+b').executeImmediately(DefaultContext.get()).invokeWithObject(DefaultContext.get(), null, [], new Map(Object.entries({a:Float.valueOf(40),b:Float.valueOf(2)}))), 42);
      jelAssert.equal(new JEL('(a,b)=>a+b').executeImmediately(DefaultContext.get()).invokeWithObject(DefaultContext.get(), null, [Float.valueOf(40)], new Map(Object.entries({b:Float.valueOf(2)}))), 42);
      jelAssert.equal(new JEL('(a,b)=>b').executeImmediately(DefaultContext.get()).invokeWithObject(DefaultContext.get(), null, []), null);

      jelAssert.equal(new JEL('()=>this').executeImmediately(DefaultContext.get()).invokeWithObject(DefaultContext.get(), Float.valueOf(42), []), 42);
      jelAssert.equal(new JEL('(x)=>this+x').executeImmediately(DefaultContext.get()).invokeWithObject(DefaultContext.get(), Float.valueOf(42), [Float.valueOf(66)]), 108);
     
      jelAssert.equal(new JEL('(x=>x)(66)').executeImmediately(DefaultContext.get()), 66);
      jelAssert.equal(new JEL('(x=>x)(x=66)').executeImmediately(DefaultContext.get()), 66);
      jelAssert.equal(new JEL('((x)=>x)(x=66)').executeImmediately(DefaultContext.get()), 66);
      jelAssert.equal(new JEL('((a,b)=>a+b)(20, 22)').executeImmediately(DefaultContext.get()), 42);
      jelAssert.equal(new JEL('((a,b)=>a+b)(b=20, a=22)').executeImmediately(DefaultContext.get()), 42);

      jelAssert.equal(new JEL('((a=1,b=2)=>a+b)()').executeImmediately(DefaultContext.get()), 3);
      jelAssert.equal(new JEL('((a=1,b=2)=>a+b)(5)').executeImmediately(DefaultContext.get()), 7);
     
      jelAssert.equal(new JEL('((a: Float = 1,b: Float=2)=>a+b)(5)').executeImmediately(DefaultContext.get()), 7);
      jelAssert.equal(new JEL('((a: Float?)=>a)(5)').executeImmediately(DefaultContext.get()), 5);
      jelAssert.equal(new JEL('((a: Float?)=>a)(null)').executeImmediately(DefaultContext.get()), null);
      jelAssert.equal(new JEL('((a: Float?)=>a)()').executeImmediately(DefaultContext.get()), null);

      jelAssert.equal(new JEL('((a: Float?) as Float=>a)(5)').executeImmediately(DefaultContext.get()), 5);
      jelAssert.equal(new JEL('((a: Float?) as Float?=>a)(null)').executeImmediately(DefaultContext.get()), null);
      jelAssert.equal(new JEL('((a: Float?) as Float?=>a)()').executeImmediately(DefaultContext.get()), null);

     
      return Promise.all([jelAssert.errorPromise('((a: Float?) as String=>a)(42)'), 
                          jelAssert.errorPromise('((a: Float?)=>a)("this is a string")'),
                          jelAssert.errorPromise('((a: PromiseType(number))=>a)("this is a string")'),
                          jelAssert.equalPromise('((a: PromiseType(number))=>a)(5)', 5),
                          jelAssert.equalPromise('((a: PromiseType(number))=>a)(a=5)', 5),
                          jelAssert.equalPromise('((a: PromiseType(number?))=>a)()', null),
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
     l.push(JEL.execute('A.promise(3)+4', ctx).then(v=>assert.equal(v, 7)));
     l.push(JEL.execute('3+A.promise(4)', ctx).then(v=>assert.equal(v, 7)));
     l.push(JEL.execute('A.promise(3)+A.promise(4)', ctx).then(v=>assert.equal(v, 7)));
     l.push(JEL.execute('A.promise(A.x)+A.promise(A.x)', ctx).then(v=>assert.equal(v, 84)));
     l.push(JEL.execute('A.promise(A)[A.promise("x")]', ctx).then(v=>assert.equal(v, 42)));
     l.push(JEL.execute('A.promise(A).promise(A.promise(3))', ctx).then(v=>assert.equal(v, 3)));
     l.push(JEL.execute('if (!A.promise(0)) then A.promise(4) else 5', ctx).then(v=>assert.equal(v, 4)));
     l.push(JEL.execute('((a,b,c,d,e)=>a+4*b+5*c+30*d+100*e)(A.promise(2), 5, A.promise(1), d=A.promise(10), e=1)', ctx).then(v=>assert.equal(v, 427)));

     return Promise.all(l);
   });

    
    
  });
});

