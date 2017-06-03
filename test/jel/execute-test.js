'use strict';

const assert = require('assert');
const JEL = require('../../src/jel/jel.js');
const jelAssert = require('./jel-assert.js');

const Callable = require('../../src/jel/callable.js');
const JelType = require('../../src/jel/type.js');
const JelNode = require('../../src/jel/node.js');
const Literal = require('../../src/jel/nodes/literal.js');
const Variable = require('../../src/jel/nodes/variable.js');
const Operator = require('../../src/jel/nodes/operator.js');
const List = require('../../src/jel/nodes/list.js');
const Reference = require('../../src/jel/nodes/reference.js');
const Condition = require('../../src/jel/nodes/condition.js');
const Assignment = require('../../src/jel/nodes/assignment.js');
const With = require('../../src/jel/nodes/with.js');
const Lambda = require('../../src/jel/nodes/lambda.js');
const Call = require('../../src/jel/nodes/call.js');

describe('jelExecute', function() {
  describe('parseExpression()', function() {
    
    it('should execute a simple literal', function() {
      assert.equal(new JEL('5').execute(), 5);
      assert.equal(new JEL('+5').execute(), 5);
      assert.equal(new JEL('-5').execute(), -5);
      assert.equal(new JEL('- 5').execute(), -5);
      assert.equal(new JEL('"foo"').execute(), 'foo');
      assert.equal(new JEL('true').execute(), true);
      assert.equal(new JEL('null').execute(), null);
    });

   it('should execute primitive operations', function() {
      assert.equal(new JEL('5+5').execute(), 10);
      assert.equal(new JEL('5*5').execute(), 25);
      assert.equal(new JEL('7-5').execute(), 2);
      assert.equal(new JEL('!true').execute(), false);
      assert.equal(new JEL('-(10/2)').execute(), -5);
      assert.equal(new JEL('"foo"+"bar"').execute(), "foobar");
      assert.equal(new JEL('5>5').execute(), false);
      assert.equal(new JEL('5<5').execute(), false);
      assert.equal(new JEL('5==5').execute(), true);
    });

    
   it('should support logical OR (||)', function() {
      assert.equal(new JEL('true||false').execute(), true);
      assert.equal(new JEL('true||true').execute(), true);
      assert.equal(new JEL('false||true').execute(), true);
      assert.equal(new JEL('false||false').execute(), false);
      assert.equal(new JEL('17||0').execute(), 17);
      assert.equal(new JEL('15||"test"').execute(), 15);
      assert.equal(new JEL('""||"foo"').execute(), "foo");
      assert.equal(new JEL('0||""').execute(), 0);
    });

    it('should support logical AND (&&)', function() {
      assert.equal(new JEL('true && false').execute(), false);
      assert.equal(new JEL('true && true').execute(), true);
      assert.equal(new JEL('false && true').execute(), false);
      assert.equal(new JEL('false && false').execute(), false);
      assert.equal(new JEL('17 && 0').execute(), 0);
      assert.equal(new JEL('15 && "test"').execute(), "test");
      assert.equal(new JEL('"" && "foo"').execute(), "");
      assert.equal(new JEL('0 && ""').execute(), 0);
    });

    it('should access member fields', function() {
      class A extends JelType {
        constructor() {
          super();
          this.x = 3;
          this.y = "foo";
        }
      }
      A.prototype.JEL_PROPERTIES = {x:1,y:1};
      
      assert.equal(new JEL('a.x').execute({a:new A()}), 3);
      assert.equal(new JEL('(a).y').execute({a:new A()}), "foo");
      assert.equal(new JEL('(a).z').execute({a:new A()}), null);
      assert.equal(new JEL('(a) . 5').execute({a:new A()}), null);
      assert.equal(new JEL('(a)."x"').execute({a:new A()}), null);
      
      class B extends JelType {
        constructor(ref) {
          super();
          this.ref = ref;
        }
      }
      B.prototype.JEL_PROPERTIES = {ref:1};
      
      assert.equal(new JEL('b.ref').execute({b: new B(5)}), 5);
      assert.equal(new JEL('b.ref.ref.ref').execute({b: new B(new B(new B(7)))}), 7);
   });

   it('should access methods', function() {
      class A extends JelType {
        constructor(a = 2, b = 5) {
          super();
          this.x = a;
          this.y = b;
        }
        static create(a, b) {
          return new A(a, b);
        }
        getX() {
          return this.x;
        }
        calc(a, b, c, d, e) {
          return a + 2*b + 3*c + 4*d + 5*e;
        }
      }
      A.create_jel_mapping = {a:0, b:1};
      A.prototype.getX_jel_mapping = {};
      A.prototype.calc_jel_mapping = {a:0,b:1,c:2,d:3,e:4};
     
      const create = new Callable(A.create, A.create_jel_mapping);
      assert(new JEL('a.getX').execute({a:new A()}) instanceof Callable);
      assert.equal(new JEL('a.getX()').execute({a:new A()}), 2);
      assert(new JEL('A()').execute({A:create}) instanceof A);
      assert.equal(new JEL('A().getX()').execute({A:create}), 2);
      assert.equal(new JEL('A(a=55).getX()').execute({A:create}), 55);
      assert.equal(new JEL('A(55).getX()').execute({A:create}), 55);
      assert.equal(new JEL('A(b=77,a=55).getX()').execute({A:create}), 55);
      assert.equal(new JEL('A().calc(3, 2, 1, 100, 1000)').execute({A:create}), 3+4+3+400+5000);
      assert.equal(new JEL('A().calc(b= 2, c= 1, e= 1000, d= 100, a=3)').execute({A:create}), 3+4+3+400+5000);
      assert.equal(new JEL('A().calc(3, 2, c=1, e=1000, d=100)').execute({A:create}), 3+4+3+400+5000);
    });

    
   it('should access variables', function() {
      assert.equal(new JEL('a').execute({a: 10}), 10);
      assert.equal(new JEL('a+b').execute({a: 1, b: 3}), 4);
    });
    
    
   it('supports conditions', function() {
      assert.equal(new JEL('if true then 1 else 2').execute(), 1);
      assert.equal(new JEL('if false then 1 else 2').execute(), 2);
      assert.equal(new JEL('if 8 then 1 else 2').execute(), 1);
      assert.equal(new JEL('if 0 then 1 else 2').execute(), 2);
      assert.equal(new JEL('if "j" then 1 else 2').execute(), 1);
      assert.equal(new JEL('if "" then 1 else 2').execute(), 2);
      assert.equal(new JEL("if 2>1 then 'foo' else 'bar'").execute(), "foo");
      assert.equal(new JEL("if 2<1 then 'foo' else 'bar'").execute(), "bar");
      assert.equal(new JEL("if 2<1 then 'foo' else if 3>2 then 2 else 1").execute(), 2);
      assert.equal(new JEL("if 2>1 then (if 3<2 then 2 else 1) else 6").execute(), 1);
    });

    it('supports lists', function() {
      assert.deepEqual(new JEL('[]').execute(), []);
      assert.deepEqual(new JEL('[1]').execute(), [1]);
      assert.deepEqual(new JEL('[7, 9-4, 7*3]').execute(), [7, 5, 21]);
    });

    it('supports with', function() {
      assert.equal(new JEL('with a=1: a').execute(), 1);
      assert.equal(new JEL('with a=1, b=2: a+b').execute(), 3);
      assert.deepEqual(new JEL('with a=1, b=a+1, c=b*3, d=c*4, e=d/6: [a,b,c,d,e]').execute(), [1,2,6,24,4]);
    });

    // TODO: lambda
    // TODO: call
    
    // TODO: &&
    // TODO: ||
    // TODO: member op
    // TODO: method op
    
  });
});

