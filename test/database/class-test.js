'use strict';

require('source-map-support').install();
const Database = require('../../build/database/Database.js').default;
const DbSession = require('../../build/database/DbSession.js').default;
const DatabaseContext = require('../../build/database/DatabaseContext.js').default;
const DbRef = require('../../build/database/DbRef.js').default;
const Class = require('../../build/jel/types/Class.js').default;
const JEL = require('../../build/jel/JEL.js').default;
const BaseTypeRegistry = require('../../build/jel/BaseTypeRegistry.js').default;
const Serializer = require('../../build/jel/Serializer.js').default;
const JelObject = require('../../build/jel/JelObject.js').default;
const NativeJelObject = require('../../build/jel/types/NativeJelObject.js').default;
const Context = require('../../build/jel/Context.js').default;
const DefaultContext = require('../../build/jel/DefaultContext.js').default;
const Util = require('../../build/util/Util.js').default;
const JelString = require('../../build/jel/types/JelString.js').default;
const Dictionary = require('../../build/jel/types/Dictionary.js').default;
const assert = require('assert');
const {JelAssert, JelPromise, JelConsole} = require('../jel-assert.js');
const jelAssert = new JelAssert();

describe('Class', function() {
  let db, session, ctx;
  before(function() {
    return Database.create('build/tmp/classtestdb')
      .then(newdb=>{
        db = newdb;
        return DbSession.create(db).then(s=>{
          session = s;
          ctx = s.ctx;
          jelAssert.setCtx(ctx);
        })
      });
  });


  it('can be created', function() {
    jelAssert.equal('(class MyTestType: constructor(x, y)=> {} a: number b: string add()=>this.a+this.b).methods.size', '1'); 
    jelAssert.equal('class MyTestType: constructor(x, y)=> {} a: number b: string add()=>this.a+this.b', 
                    'class MyTestType: constructor(x, y)=> {} a: number b: string add()=>this.a+this.b');
    jelAssert.equal('class MyTestType constructor(x, y) a: Float b: String c: number add()=>this.a+this.b', 
                    'class MyTestType: constructor(x, y)=>{} a: Float b: String c: number add()=> this.a+this.b');
  });

  it('supports properties set in the constructor', function() {
    jelAssert.equal('do let myTestType=class MyTestType constructor(x: Float|String, y: Float|String)=>{}, m=myTestType(5, "foo"): [m.x, m.y]', "[5, 'foo']");
    jelAssert.equal('do let myTestType=class MyTestType constructor(x: Float, y: String)=>{}, m=myTestType(5, "foo"): [m.x, m.y]', "[5, 'foo']");

    jelAssert.equal('do let myTestType=class MyTestType: constructor(x: Float, y: String)=>{}, m=myTestType(y="foo", x=2): [m.x, m.y]', "[2, 'foo']");
    jelAssert.equal('do let myTestType=class MyTestType: x: int constructor()=>{x: 5}, m=myTestType(): m.x', "5");
    jelAssert.equal('do let myTestType=class MyTestType: x: int = 17 constructor()=>{}, m=myTestType(): m.x', "17");
    jelAssert.equal('do let myTestType=class MyTestType: x: int = 15 constructor()=>{x:17}, m=myTestType(): m.x', "17");

    return Promise.all([jelAssert.errorPromise('do let myTestType=class MyTestType constructor(x,y)=>{} x: Float y: String, m=myTestType("wrong type", "foo"): [m.x, m.y]', 'redundant local declarations'),
                        jelAssert.errorPromise('do let myTestType=class MyTestType constructor(x: Float, y: String)=>{}, m=myTestType("wrong type", "foo"): [m.x, m.y]', 'type'),
                        jelAssert.errorPromise('do let myTestType=class MyTestType constructor(x: number,y: string)=>{}, m=myTestType(): [m.x, m.y]', 'x is missing'),
                        jelAssert.errorPromise('do let myTestType=class MyTestType: x: int constructor()=>{x: 0.5}, m=myTestType(): m.x', 'int'),
                        jelAssert.errorPromise('do let myTestType=class MyTestType: constructor()=>{x: 0.5}: myTestType()', "returned property 'x'")]);
  });

  it('supports methods', function() {
    jelAssert.equal('do let myTestType=class MyTestType constructor(x: Float, y: Float)=>{} add()=>this.x+this.y, m=myTestType(5, 12): m.add()', "17");
    jelAssert.equal('do let myTestType=class MyTestType constructor(x: Float, y: Float)=>{} add(a, b)=>this.x+this.y+a/b, m=myTestType(5, 12): m.add(20, 4)', "22");
    jelAssert.equal('do let myTestType=class MyTestType constructor(x: Float, y: Float)=>{} add(a, b)=>this.x+this.y+a/b, m=myTestType(5, 12): m.add(b=4, a=20)', "22");
    jelAssert.equal('do let myTestType=class MyTestType constructor(x: Float, y: Float)=>{} add(a=20, b=4)=>this.x+this.y+a/b, m=myTestType(5, 12): m.add()', "22");
    jelAssert.equal('do let myTestType=class MyTestType constructor(x: Float, y: Float)=>{} add(a, b)=>this.x+this.y+a/b, m=myTestType(15, 12), add=m.add: add(b=4, a=20)', "32");

    jelAssert.equal('do let myTestType=class MyTestType: constructor(x: Float, y: Float) => {} add(a, b)=>this.x+this.y+a/b, m=myTestType(15, 12), add=m.add: add(b=4, a=20)', "32");
    jelAssert.equal('do let myTestType=class MyTestType: constructor(x: Float, y: Float) => {} add(a, b): Float=>this.x+this.y+a/b, m=myTestType(15, 12), add=m.add: add(b=4, a=20)', "32");
    jelAssert.equal('do let myTestType=class MyTestType: constructor() => {} add(a: number, b: number?): number =>a + if b==null then 30 else b, m=myTestType(): [m.add(5, 10), m.add(10)]', "[15, 40]");

    jelAssert.equal('do let myTestType=class MyTestType constructor()=>{}  div(a, b)=>a/b, m=myTestType(), div=m.div: m.div(60, 10) + div(40, 10)', "10");
  });

  it('supports vararg methods', function() {
    jelAssert.equal('do let myTestType=class MyTestType constructor() test(a, ...b)=>[a, b], m=myTestType(): m.test(5, 12)', "[5, [12]]");
    jelAssert.equal('do let myTestType=class MyTestType constructor() test(a, ...b)=>[a, b], m=myTestType(): m.test(5)', "[5, []]");
    jelAssert.equal('do let myTestType=class MyTestType constructor() test(a, ...b: int[])=>[a, b], m=myTestType(): m.test(5, 1, 2)', "[5, [1, 2]]");
  
    jelAssert.equal('do let myTestType=class MyTestType constructor() test(a: int?, ...b: int[])=>[a, b], m=myTestType(): m.test(b=[6, 3])', "[null, [6, 3]]");
    
    jelAssert.equal('do let myTestType=class MyTestType constructor() static test(...b: int[])=>b: myTestType.test()', "[]");
    jelAssert.equal('do let myTestType=class MyTestType constructor() static test(...b: int[])=>b: myTestType.test(1, 2)', "[1, 2]");
    jelAssert.equal('do let myTestType=class MyTestType constructor() static test(...b: int[])=>b: myTestType.test(b=[])', "[]");
    jelAssert.equal('do let myTestType=class MyTestType constructor() static test(...b: int[])=>b: myTestType.test(b=[6, 2])', "[6, 2]");

    return jelAssert.errorPromise('do let myTestType=class MyTestType constructor() static test(...b, a)=>b: myTestType.test(1, 2)', 'only supported as the last argument');
  });
 
  it('supports packages', function() {
    jelAssert.equal('do let myTestType=class My::Test::Type: : myTestType.packageName', "'My::Test'");
  });

  it('supports serialization of instances', function() {
    const ctx2 = ctx.plus({MyType: new JEL('class MyType: constructor(a, b, c)=>{}').executeImmediately(ctx)});
    const serialized = Serializer.serialize(new JEL('MyType(4, 1, 6)').executeImmediately(ctx2));
    const obj = new JEL(serialized).executeImmediately(ctx2);
    assert.equal(obj.props.elements.get('a'), 4);
    assert.equal(obj.props.elements.get('c'), 6);
  });

  it('supports superTypes', function() {
    jelAssert.equal(`do let superType=class SuperType: constructor(x: Float, y: Float)=> {} add(a, b=1)=>a+b sub(a, b=1)=>a-b,
                          subType=class SubType extends superType: constructor(x, y, z)=> {} override add(a,b=2)=>a+b+10 mul(a,b=1)=>a*b,
                          s1 = superType(4, 6),
                          s2 = subType(8, 10, 20): 
                        [s1.x, s1.y, s2.x, s2.y, s2.z, s1.add(5), s1.sub(4), s2.add(6), s2.sub(33), s2.mul(9, 9)]`, "[4, 6, 8, 10, 20, 6, 3, 18, 32, 81]");

    jelAssert.equal(`do let superType=class SuperType: a=1 constructor()=>{}, subType=class SubType extends superType: b=1 constructor()=>{}, other=class Other: c=1 constructor()=>{},
                      super1=superType(), sub1=subType(), o=other():
                        [super1 instanceof superType, super1 instanceof subType, super1 instanceof other,
                         sub1 instanceof superType, sub1 instanceof subType, sub1 instanceof other,
                         o instanceof superType, o instanceof subType, o instanceof other]`, "[true, false, false, true, true, false, false, false, true]");
  });

  it('supports abstract superTypes', function() {
    jelAssert.equal(`do let superType=abstract class SuperType: a=1 constructor(x=1)=>{a:x+5} abstract test(), subType=class SubType extends superType: constructor()=>super(9) override test()=>1, sub1=subType():
                        [sub1.a, sub1.test()]`, "[14,1]");

    jelAssert.equal(`do let superType=abstract class SuperType: abstract a: int abstract b: string? abstract c: int? constructor()=>{}, 
                         subType=class SubType extends superType: override a  = 1 override b = 'foo' override c  constructor()=>{},
                         sub1=subType():
                        [sub1.a, sub1.b, sub1.c]`, "[1, 'foo', null]");

    return Promise.all([
      jelAssert.errorPromise(`do let s = abstract class AC: constructor()=>{} : s()`, 'declared abstract'),
      jelAssert.errorPromise(`do let s = abstract class AC: constructor()=>{} abstract a = 1: s()`, 'must not have a default value'),
      jelAssert.errorPromise(`do let s = (abstract class AC: abstract a: int): abstract class X extends s: override a: int = 1`, 'overriding property must not specify a type'),
      jelAssert.errorPromise(`do let s = (abstract class AC: abstract a: int), x=(class X extends s: constructor()=>{}  override a): x()`, 'has no default'),
      jelAssert.errorPromise(`do let superType=abstract class SuperType: a=1 constructor(x=1)=>{a:x+5} abstract test(), subType=class SubType extends superType: constructor()=>super(9): subType()`, 'Missing override')
    ]);
  });

  it('allows overriding methods', function() {
    jelAssert.equal(`do let superType=class SuperType: constructor()=>{} incX(x)=>x+1, subType=class SubType extends superType: constructor()=>{} override incX(x)=>x+2, sup1=superType(), sub1=subType():
                        [sup1.incX(5), sub1.incX(10)]`, "[6, 12]");
    jelAssert.equal(`do let superType=class SuperType: constructor()=>{} incX(x): int=> x+1, subType=class SubType extends superType: constructor()=>{} override incX(x):int=>x+2, sup1=superType(), sub1=subType():
                        [sup1.incX(5), sub1.incX(10)]`, "[6, 12]");

    jelAssert.equal(`do let superType=class SuperType: constructor()=>{} a()=>5 b()=>this.a(), subType=class SubType extends superType: constructor()=>{} override a()=>10, sup1=superType(), sub1=subType():
                        [sup1.a(), sub1.a()]`, "[5, 10]");

    return Promise.all([
      jelAssert.errorPromise(`do let superType=abstract class SuperType: incX(x: int)=>x+1, subType=class SubType extends superType: constructor()=>{} override incX(x: number)=>x+2: subType()`, 'number'),
      jelAssert.errorPromise(`do let superType=abstract class SuperType: incX(a,b,c,d,e,f)=>a+1, subType=class SubType extends superType: constructor()=>{} override incX(a,b,c,d,e,f,g)=>a+2: subType()`, '7'),
      jelAssert.errorPromise(`do let superType=abstract class SuperType: incX(x: int)=>x+1, subType=class SubType extends superType: constructor()=>{} override incX(x: any)=>x+2: subType()`, 'any'),
      jelAssert.errorPromise(`do let superType=abstract class SuperType: incX(x):number=> x+1, subType=class SubType extends superType: constructor()=>{} override incX(x):int=> x+2: subType()`, 'return type'),
      jelAssert.errorPromise(`do let superType=class SuperType: constructor()=>{} incX(x)=>x+1, subType=class SubType extends superType: constructor()=>{} incX(x)=>x+2: subType()`, `method needs an 'override'`)
      ]);
  });


  it('supports static properties', function() {
    jelAssert.equal('do let myTestType=class MyTestType: static add(a,b):Float=>a+b static ft = 42: myTestType.ft + myTestType.add(1, 2)', "45");
    jelAssert.equal('do let myTestType=class MyTestType: static add(a: number,b: number?):number=>a+ if b==null then 100 else b: myTestType.add(1, 2)+myTestType.add(5)', "108");
  });

  it('supports static properties that use the constructor or other elements', function() {
    jelAssert.equal('do let myTestType=class MyTestType: static a = 1 static b=MyTestType.a+1 static c=MyTestType.b+MyTestType.a: [myTestType.a, myTestType.b, myTestType.c]', "[1, 2, 3]");
    jelAssert.equal('do let myTestType=class MyTestType1: static ft = 44 static ft1=MyTestType1.ft+1: myTestType.ft1', "45");
    jelAssert.equal('do let myTestType=class MyTestType2: static add(a,b): number=>a+b static ft = MyTestType2.add(1, 3): myTestType.ft', "4");
    jelAssert.equal('do let myTestType=class MyTestType3: constructor(a: int)=> {} static ft = MyTestType3(42): myTestType.ft.a', "42");
    jelAssert.equal('do let myTestType=class MyTestType4: x: int constructor()=> {x: MyTestType4.X} static X = 100: myTestType().x', "100");
    jelAssert.equal('do let myTestType=class MyTestType4: x: int constructor()=> {x: this.X} static X = 100: myTestType().x', "100");
  });

  it('allows access to static properties in all default values', function() {
    jelAssert.equal('do let myTestType=class MyTestType static X=42 x=MyTestType.X constructor() : myTestType().x', "42");
    jelAssert.equal('do let myTestType=class MyTestType static X=42 constructor() ret(i=MyTestType.X)=>i: myTestType().ret()', "42");
    jelAssert.equal('do let myTestType=class MyTestType static X=42 constructor(y=MyTestType.X): myTestType().y', "42");
    jelAssert.equal('do let myTestType=class MyTestType static X=42 static ret(i=MyTestType.X)=>i: myTestType.ret()', "42");
  });

  it('supports getter', function() {
    jelAssert.equal('do let myTestType=class MyTestType: constructor(y: Float)=>{} get x():Float=>8 get z()=>4, m=myTestType(5): m.x/m.z', "2");

    jelAssert.equal(`do let superType=class SuperType: constructor()=>{} get x()=>1, subType=class SubType extends superType: constructor()=>{} override get x()=>42, sup1=superType(), sub1=subType():
                        [sup1.x, sub1.x]`, "[1, 42]");

    return Promise.all([
      jelAssert.errorPromise(`do let superType=class SuperType: constructor()=>{} get x()=>1, subType=class SubType extends superType: constructor()=>{} get x()=>2: subType()`, `needs an 'override'`),
      jelAssert.errorPromise(`do let superType=class SuperType: constructor()=>{} get x()=>1, subType=class SubType extends superType: constructor()=>{} override get x(): int=>2: subType()`, `return: int`),
      jelAssert.errorPromise(`do let superType=class SuperType: constructor()=>{} get x():string=>'foo', subType=class SubType extends superType: constructor()=>{} override get x()=>'bar': subType()`, `overriding getter has no return type`),
      jelAssert.errorPromise(`do let superType=class SuperType: constructor()=>{} get x():string=>'foo', subType=class SubType extends superType: constructor()=>{} override get x(): int=>2: subType()`, `incompatible with overriding type`)
      ]);
  });

  it('supports ops', function() {
    jelAssert.equal('do let myTestType=class MyTestType constructor(x: Float)=>{} op+(right)=>myTestType(this.x+right), m=myTestType(5): (m+10).x', "15");
    jelAssert.equal('do let myTestType=class MyTestType constructor(x: Float)=>{} singleOp-()=>myTestType(-this.x*2), m=myTestType(5): (-m).x', "-10");

    jelAssert.equal('do let myTestType=class MyTestType: constructor(x: Float)=>{} op+(right)=> myTestType(this.x+right), m=myTestType(5): (m+10).x', "15");
    jelAssert.equal('do let myTestType=class MyTestType: constructor(x: Float)=>{} op+(right):Float=> this.x+right, m=myTestType(5): m+10', "15");
  });

  it('allows typed ops', function() {
    jelAssert.equal('do let myTestType=class MyTestType constructor(x: Float)=>{} op+(right: int)=>myTestType(this.x+right), m=myTestType(5): (m+10).x', "15");
    return jelAssert.errorPromise('do let myTestType=class MyTestType constructor(x: Float)=>{} op+(right: int)=>myTestType(this.x+right), m=myTestType(5): m+"x"', "Failed to convert value");
  });
  
  it('can refer to itself as a type and supports circular dependencies', function() {
    return Promise.all([
      jelAssert.equalPromise('do let myTestType=class MyTestType constructor(parent: MyTestType?)=>{} static hasParent(p: MyTestType)=>p.parent!=null, m=myTestType(), n=myTestType(m): [myTestType.hasParent(m), myTestType.hasParent(n)]', "[false,true]"),
      jelAssert.equalPromise('do let a=class A constructor(b: B?), b=class B constructor(c: C), c = class C constructor(a: A?) n="C", x=a(b(c())): x.b.c.n', "'C'"),
      jelAssert.errorPromise('do let myTestType=class MyTestType constructor(parent: MyTestType?)=>{} static hasParent(p: MyTestType)=>p.parent!=null: myTestType(1)', 'to SimpleType')
    ]);
  });




  it('can be loaded from DB and used like a native type', function() {
    return db.put(ctx, new JEL('class TupleXY: s: int = 49 constructor(x: Float, y: Float)=>{} add()=>this.x+this.y static A= 44 static f(): int=>55').executeImmediately(ctx))
      .then(()=>Promise.all([jelAssert.equalPromise('TupleXY(7, 10).add()', "17"),
                         jelAssert.equalPromise('TupleXY.A', "44"),
                         jelAssert.equalPromise('TupleXY(0, 0).s', "49"),
                         jelAssert.equalPromise('TupleXY.f()', "55"),
                         jelAssert.equalPromise('TupleXY(10, 19).y', '19'),
                         jelAssert.equalPromise('TupleXY(x=7, y=1) instanceof TupleXY', "true")]));
  });



  class HybridNativeTest {
    add(ctx, a,b) {
      return a.value + b.value;
    }

    static sub(ctx, a,b) {
      return a.value - b.value;
    }
  }
  HybridNativeTest.prototype.add_jel_mapping = true;
  HybridNativeTest.sub_jel_mapping = true;
  HybridNativeTest.y_jel_property = true;
  HybridNativeTest.y = 100;
  BaseTypeRegistry.register('HybridNativeTest', HybridNativeTest);

  it('supports hybrid native classes', function() {
    jelAssert.equal(`do let c=(class HybridNativeTest:\n constructor()=>{}\n static native y: int\n native add(a: int, b: int): int\n static native sub(a,b)):
                      [c.y, c().add(3, 4), c.sub(2, 1)]`, `[100, 7, 1]`);
  });



  class FullNativeTest extends NativeJelObject {
    constructor(n) {
      super('FullNativeTest');
      this.x = n;
    }

    get clazz() {
      return FullNativeTest.clazz;
    }
    
    add(ctx, a,b) {
      return a.value + b.value;
    }
    
    static sub(ctx, a,b) {
      return a.value - b.value;
    }

    static create(ctx, a) {
      return new FullNativeTest(42 + (a.value||0));
    }
  }
  FullNativeTest.prototype.x_jel_property = true;
  FullNativeTest.prototype.add_jel_mapping = true;
  FullNativeTest.sub_jel_mapping = true;
  FullNativeTest.create_jel_mapping = true;
  FullNativeTest.y_jel_property = true;
  FullNativeTest.y = 100;
  BaseTypeRegistry.register('FullNativeTest', FullNativeTest);

  it('supports fully native classes', function() {
    const cls = new JEL("native class FullNativeTest:\n native constructor(a: int)\n native x: int\n static native y: int\n native add(a: int, b: int): int\n static native sub(a,b)").executeImmediately(ctx);
    assert(cls instanceof Class);
    
    FullNativeTest.clazz = cls;
    const newCtx = ctx.plus({FullNativeTest: cls});
    
    
    jelAssert.equalWithContext(newCtx, `[FullNativeTest.y, FullNativeTest(0).add(3, 4), FullNativeTest.sub(2, 1), FullNativeTest(0).x, FullNativeTest(1).x]`, `[100, 7, 1, 42, 43]`);
  });
  
  
  class VarargTest {
    t1(ctx, a, b) {
      return b;
    }

    static t2(ctx, a) {
      return a;
    }
  }
  VarargTest.prototype.t1_jel_mapping = true;
  VarargTest.t2_jel_mapping = true;
  BaseTypeRegistry.register('VarargTest', VarargTest);

  it('supports varargs', function() {
    jelAssert.equal(`do let c=(class VarargTest:\n constructor()\n static native t2(...a)), c1=c(): c.t2(1, 2, 3)`, `[1, 2, 3]`);
    jelAssert.equal(`do let c=(class VarargTest:\n constructor()\n static native t2(...a)), c1=c(): c.t2(a=[1, 2, 3])`, `[1, 2, 3]`);
    jelAssert.equal(`do let c=(class VarargTest:\n constructor()\n native t1(a: int, ...b: int[]): int[]\n static native t2(...a)), c1=c():
                      [c1.t1(5), c1.t1(4, 8), c1.t1(4, 8, 2, 8, 7, 6), c.t2(), c.t2(1), c.t2(5, 1, 3, 0)]`, `[[], [8], [8, 2, 8, 7, 6], [], [1], [5, 1, 3, 0]]`);
    jelAssert.equal(`do let c=(class VarargTest:\n constructor()\n native t1(a: int, ...b: int[]): int[]\n static native t2(...a)), c1=c():
                      [c1.t1(5, b=[]), c1.t1(a=4, b=[8]), c1.t1(a=4, b=[8, 2, 9, 9, 2]), c.t2(a=[]), c.t2(a=[1]), c.t2(a=[5, 1, 3, 0]), c.t2(a=9)]`, `[[], [8], [8, 2, 9, 9, 2], [], [1], [5, 1, 3, 0], [9]]`);
  });

});
