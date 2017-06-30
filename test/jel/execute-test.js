'use strict';

const assert = require('assert');
const JEL = require('../../src/jel/jel.js');
const jelAssert = require('./jel-assert.js');

const Callable = require('../../src/jel/callable.js');
const JelType = require('../../src/jel/type.js');
const JelNode = require('../../src/jel/node.js');
const JelList = require('../../src/jel/list.js');
const LazyRef = require('../../src/jel/lazyref.js');
const JelDictionary = require('../../src/jel/dictionary.js');
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

describe('JEL', function() {
  describe('execute()', function() {
    
    it('should execute a simple literal', function() {
      assert.equal(new JEL('5').executeImmediately(), 5);
      assert.equal(new JEL('+5').executeImmediately(), 5);
      assert.equal(new JEL('-5').executeImmediately(), -5);
      assert.equal(new JEL('- 5').executeImmediately(), -5);
      assert.equal(new JEL('"foo"').executeImmediately(), 'foo');
      assert.equal(new JEL('true').executeImmediately(), true);
      assert.equal(new JEL('null').executeImmediately(), null);
    });

   it('should execute primitive operations', function() {
      assert.equal(new JEL('5+5').executeImmediately(), 10);
      assert.equal(new JEL('5*5').executeImmediately(), 25);
      assert.equal(new JEL('7-5').executeImmediately(), 2);
      assert.equal(new JEL('!true').executeImmediately(), false);
      assert.equal(new JEL('-(10/2)').executeImmediately(), -5);
      assert.equal(new JEL('"foo"+"bar"').executeImmediately(), "foobar");
      assert.equal(new JEL('5>5').executeImmediately(), false);
      assert.equal(new JEL('5<5').executeImmediately(), false);
      assert.equal(new JEL('5==5').executeImmediately(), true);
      assert.equal(new JEL('((-7))+3').executeImmediately(), -4);
    });

    
   it('should support logical OR (||)', function() {
      assert.equal(new JEL('true||false').executeImmediately(), true);
      assert.equal(new JEL('true||true').executeImmediately(), true);
      assert.equal(new JEL('false||true').executeImmediately(), true);
      assert.equal(new JEL('false||false').executeImmediately(), false);
      assert.equal(new JEL('17||0').executeImmediately(), 17);
      assert.equal(new JEL('15||"test"').executeImmediately(), 15);
      assert.equal(new JEL('""||"foo"').executeImmediately(), "foo");
      assert.equal(new JEL('0||""').executeImmediately(), 0);
    });

    it('should support logical AND (&&)', function() {
      assert.equal(new JEL('true && false').executeImmediately(), false);
      assert.equal(new JEL('true && true').executeImmediately(), true);
      assert.equal(new JEL('false && true').executeImmediately(), false);
      assert.equal(new JEL('false && false').executeImmediately(), false);
      assert.equal(new JEL('17 && 0').executeImmediately(), 0);
      assert.equal(new JEL('15 && "test"').executeImmediately(), "test");
      assert.equal(new JEL('"" && "foo"').executeImmediately(), "");
      assert.equal(new JEL('0 && ""').executeImmediately(), 0);
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
      
      assert.equal(new JEL('a.x').executeImmediately({a:new A()}), 3);
      assert.equal(new JEL('(a).y').executeImmediately({a:new A()}), "foo");
      assert.equal(new JEL('(a)["y"]').executeImmediately({a:new A()}), "foo");
      assert.throws(()=>new JEL('(a).z').executeImmediately({a:new A()}));
      assert.throws(()=>new JEL('(a) . 5').executeImmediately({a:new A()}));
      assert.throws(()=>new JEL('(a)."x"').executeImmediately({a:new A()}));
      
      class B extends JelType {
        constructor(ref) {
          super();
          this.ref = ref;
        }
      }
      B.prototype.JEL_PROPERTIES = {ref:1};
      
      assert.equal(new JEL('b.ref').executeImmediately({b: new B(5)}), 5);
      assert.equal(new JEL('b.ref.ref.ref').executeImmediately({b: new B(new B(new B(7)))}), 7);
   });

   it('should access methods of JelTypes', function() {
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
      assert(new JEL('a.getX').executeImmediately({a:new A()}) instanceof Callable);
      assert.equal(new JEL('a.getX()').executeImmediately({a:new A()}), 2);
      assert(new JEL('A()').executeImmediately({A:create}) instanceof A);
      assert.equal(new JEL('A().getX()').executeImmediately({A:create}), 2);
      assert.equal(new JEL('A()["getX"]()').executeImmediately({A:create}), 2);
      assert.equal(new JEL('A(a=55).getX()').executeImmediately({A:create}), 55);
      assert.equal(new JEL('A(55).getX()').executeImmediately({A:create}), 55);
      assert.equal(new JEL('A(b=77,a=55).getX()').executeImmediately({A:create}), 55);
      assert.equal(new JEL('A().calc(3, 2, 1, 100, 1000)').executeImmediately({A:create}), 3+4+3+400+5000);
      assert.equal(new JEL('A().calc(b= 2, c= 1, e= 1000, d= 100, a=3)').executeImmediately({A:create}), 3+4+3+400+5000);
      assert.equal(new JEL('A().calc(3, 2, c=1, e=1000, d=100)').executeImmediately({A:create}), 3+4+3+400+5000);
    });

   it('should access properties of built-ins', function() {
     assert.equal(new JEL('"foobar".length').executeImmediately(), 6);
   });

   it('should access methods of built-ins', function() {
     assert.equal(new JEL('" foobar   ".trim()').executeImmediately(), "foobar");
   });

    
   it('should access variables', function() {
     assert.equal(new JEL('a').executeImmediately({a: 10}), 10);
     assert.equal(new JEL('a+b').executeImmediately({a: 1, b: 3}), 4);
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
    });

    it('supports lists', function() {
      assert(new JEL('[]').executeImmediately() instanceof JelList);
      assert.deepEqual(new JEL('[]').executeImmediately().elements, []);
      assert.deepEqual(new JEL('[1]').executeImmediately().elements, [1]);
      assert.deepEqual(new JEL('[7, 9-4, 7*3]').executeImmediately().elements, [7, 5, 21]);
    });

    it('supports dictionaries', function() {
      assert.deepEqual(new JEL('{}').executeImmediately().toObjectDebug(), {});
      assert.deepEqual(new JEL('{a: 3, b: 1}').executeImmediately().toObjectDebug(), {a: 3, b: 1});
      assert.deepEqual(new JEL('{"a": 3, "b": 1}').executeImmediately().toObjectDebug(), {a: 3, b: 1});
      assert.deepEqual(new JEL("{'a': 3, 'b': 1}").executeImmediately().toObjectDebug(), {a: 3, b: 1});
      assert.deepEqual(new JEL('{a, b: 1, c}').executeImmediately({a:7,b:2,c:10}).toObjectDebug(), {a:7,b:1,c:10});
      assert.deepEqual(new JEL('{a: {b: 2}}').executeImmediately().toObjectDebug().a.toObjectDebug().b, 2);
      
      assert.throws(()=>new JEL('{a: 1, a: 2}').executeImmediately());
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
      function f(a=1, b=2) { 
        return a + b + (this && this.c || 5);
      }
      const fc1 = new Callable(f, {a:0, b:1}, {c:7});
      const fc2 = new Callable(f, {a:0, b:1});
      assert.equal(new JEL('f()').executeImmediately({f:fc1}), 10);
      assert.equal(new JEL('f()').executeImmediately({f:fc2}), 8);
      assert.equal(new JEL('f(10)').executeImmediately({f:fc1}), 19);
      assert.equal(new JEL('f(10, 100)').executeImmediately({f:fc1}), 117);
      assert.equal(new JEL('f(10, 100, 1000)').executeImmediately({f:fc1}), 117);
      assert.equal(new JEL('f(b=100, a=10)').executeImmediately({f:fc1}), 117);
      assert.equal(new JEL('f(b=100)').executeImmediately({f:fc1}), 108);
      assert.equal(new JEL('f(10, b=100)').executeImmediately({f:fc1}), 117);
      assert.equal(new JEL('f(10, b=100)').executeImmediately({f:fc2}), 115);
   });
    
   it('supports constructors and static methods', function() {
      class A extends JelType {
        constructor(a = 2, b = 5) {
          super();
          this.x = a;
          this.y = b;
        }
        static create(a, b) {
          return new A(a, b);
        }
        static pic() {
          return 3;
        }
        static add2(a = 3, b = 7) {
          return a + 2*b;
        }
      }
      A.create_jel_mapping = {a:0, b:1};
      A.pic_jel_mapping = [];
      A.add2_jel_mapping = ['a','b'];
     
      assert.equal(new JEL('A()').executeImmediately({A}).x, 2);
      assert.equal(new JEL('A()').executeImmediately({A}).y, 5);
      assert.equal(new JEL('A(7,8)').executeImmediately({A}).x, 7);
      assert.equal(new JEL('A(7,8)').executeImmediately({A}).y, 8);
      assert.equal(new JEL('A(b=9,a=3)').executeImmediately({A}).x, 3);
      assert.equal(new JEL('A(b=9,a=3)').executeImmediately({A}).y, 9);
      assert.equal(new JEL('A(3, b=1)').executeImmediately({A}).x, 3);
      assert.equal(new JEL('A(3, b=1)').executeImmediately({A}).y, 1);
      assert.equal(new JEL('A(b=1)').executeImmediately({A}).x, 2);
      assert.equal(new JEL('A(b=1)').executeImmediately({A}).y, 1);

      assert.equal(new JEL('A.pic()').executeImmediately({A}), 3);

      assert.equal(new JEL('A.add2()').executeImmediately({A}), 17);
      assert.equal(new JEL('A.add2(1)').executeImmediately({A}), 15);
      assert.equal(new JEL('A.add2(5, 2)').executeImmediately({A}), 9);
      assert.equal(new JEL('A.add2(b=1)').executeImmediately({A}), 5);
      assert.equal(new JEL('A.add2(6)').executeImmediately({A}), 20);
   });

   it('supports named-argument only calls', function() {
      class A extends JelType {
        constructor() {
          super();
        }
        static add2({a = 3, b = 7, c = 5} = {}) {
          return a + 10*b + 100*c;
        }
      }
      A.add2_jel_mapping = 'named';
     
      assert.equal(new JEL('A.add2()').executeImmediately({A}), 573);
      assert.throws(()=>new JEL('A.add2(1, 2, 3)').executeImmediately({A}));
      assert.equal(new JEL('A.add2(a=1, b=2, c=3)').executeImmediately({A}), 321);
      assert.equal(new JEL('A.add2(c=7)').executeImmediately({A}), 773);
      assert.equal(new JEL('A.add2(c=7, a=5)').executeImmediately({A}), 775);
   });

    
   it('supports lambda', function() {
      assert(new JEL('a=>1').executeImmediately({}) instanceof Callable);
      assert.equal(new JEL('a=>55').executeImmediately({}).invokeWithObject([], {}), 55);
      assert.equal(new JEL('x=>x').executeImmediately({}).invokeWithObject([66], {}), 66);
      assert.equal(new JEL('x=>x').executeImmediately({}).invokeWithObject([66], {}), 66);
      assert.equal(new JEL('x=>x').executeImmediately({}).invoke(66), 66);
      assert.equal(new JEL('x=>x').executeImmediately({}).invokeWithObject([], {x:66}), 66);
      assert.equal(new JEL('(a,b)=>a+b').executeImmediately({}).invokeWithObject([], {a:40,b:2}), 42);
      assert.equal(new JEL('(a,b)=>a+b').executeImmediately({}).invokeWithObject([40], {b:2}), 42);
      assert.equal(new JEL('(a,b)=>b').executeImmediately({}).invokeWithObject([], {}), null);

      assert.equal(new JEL('(x=>x)(66)').executeImmediately({}), 66);
      assert.equal(new JEL('(x=>x)(x=66)').executeImmediately({}), 66);
      assert.equal(new JEL('((a,b)=>a+b)(20, 22)').executeImmediately({}), 42);
      assert.equal(new JEL('((a,b)=>a+b)(b=20, a=22)').executeImmediately({}), 42);
   });
    
   it('supports promises', function() {
     class A extends JelType {
       static promise(value) {
         return new Promise((resolve)=>setTimeout(()=>resolve(value), 1));
       }
      
     }
     A.promise_jel_mapping = ['value'];
     A.x = 42;
     A.JEL_PROPERTIES = {x:1};

     const l = [];
     l.push(JEL.execute('A.promise(3)+4', {A}).then(v=>assert.equal(v, 7)));
     l.push(JEL.execute('3+A.promise(4)', {A}).then(v=>assert.equal(v, 7)));
     l.push(JEL.execute('A.promise(3)+A.promise(4)', {A}).then(v=>assert.equal(v, 7)));
     l.push(JEL.execute('A.promise(A.x)+A.promise(A.x)', {A}).then(v=>assert.equal(v, 84)));
     l.push(JEL.execute('A.promise(A)[A.promise("x")]', {A}).then(v=>assert.equal(v, 42)));
     l.push(JEL.execute('A.promise(A).promise(A.promise(3))', {A}).then(v=>assert.equal(v, 3)));
     l.push(JEL.execute('if (!A.promise(0)) then A.promise(4) else 5', {A}).then(v=>assert.equal(v, 4)));
     l.push(JEL.execute('((a,b,c,d,e)=>a+4*b+5*c+30*d+100*e)(A.promise(2), 5, A.promise(1), d=A.promise(10), e=1)', {A}).then(v=>assert.equal(v, 427)));

     return Promise.all(l);
   });
    
   it('supports LazyRefs', function() {
     class MyRef extends LazyRef {
        constructor(value) {
          super();
          this.value = value;
        }
       get() {
         return this.value;
       }
     }
     
     class A extends JelType {
       static promiseRef(value) {
         return this.ref(new Promise((resolve)=>setTimeout(()=>resolve(value), 1)));
       }
       static ref(value) {
         return new MyRef(value);
       }      
     }
     A.promiseRef_jel_mapping = ['value'];
     A.ref_jel_mapping = ['value'];
     A.x = 42;
     A.JEL_PROPERTIES = {x:1};

     const l = [];
     l.push(JEL.execute('A.ref(3)+4', {A}).then(v=>assert.equal(v, 7)));
     l.push(JEL.execute('3+A.ref(4)', {A}).then(v=>assert.equal(v, 7)));
     l.push(JEL.execute('A.ref(3)+A.ref(4)', {A}).then(v=>assert.equal(v, 7)));
     l.push(JEL.execute('A.ref(A.x)+A.ref(A.x)', {A}).then(v=>assert.equal(v, 84)));
     l.push(JEL.execute('A.ref(A)[A.ref("x")]', {A}).then(v=>assert.equal(v, 42)));
     l.push(JEL.execute('A.ref(A).ref(A.ref(3))', {A}).then(v=>assert.equal(v.value, 3)));
     l.push(JEL.execute('if (!A.ref(0)) then A.ref(4) else 5', {A}).then(v=>assert.equal(v.value, 4)));
     l.push(JEL.execute('((a,b,c,d,e)=>a+4*b+5*c+30*d+100*e)(A.ref(2), 5, A.ref(1), d=A.ref(10), e=1)', {A}).then(v=>assert.equal(v, 427)));

     l.push(JEL.execute('A.promiseRef(3)+4', {A}).then(v=>assert.equal(v, 7)));
     l.push(JEL.execute('A.promiseRef(3)+A.ref(4)', {A}).then(v=>assert.equal(v, 7)));
     l.push(JEL.execute('3+A.promiseRef(4)', {A}).then(v=>assert.equal(v, 7)));
     l.push(JEL.execute('A.promiseRef(3)+A.promiseRef(4)', {A}).then(v=>assert.equal(v, 7)));
     l.push(JEL.execute('A.promiseRef(A.x)+A.promiseRef(A.x)', {A}).then(v=>assert.equal(v, 84)));
     l.push(JEL.execute('A.promiseRef(A)[A.promiseRef("x")]', {A}).then(v=>assert.equal(v, 42)));
     l.push(JEL.execute('((a,b,c,d,e)=>a+4*b+5*c+30*d+100*e)(A.promiseRef(2), 5, A.promiseRef(1), d=A.ref(10), e=1)', {A}).then(v=>assert.equal(v, 427)));

     return Promise.all(l);
   });
    
    
  });
});

