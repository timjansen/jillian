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
const Context = require('../../build/jel/Context.js').default;
const DefaultContext = require('../../build/jel/DefaultContext.js').default;
const Util = require('../../build/util/Util.js').default;
const JelString = require('../../build/jel/types/JelString.js').default;
const Dictionary = require('../../build/jel/types/Dictionary.js').default;
const tmp = require('tmp');
const assert = require('assert');
const {JelAssert, JelPromise, JelConsole} = require('../jel-assert.js');
const jelAssert = new JelAssert(DefaultContext.get());

tmp.dir(function(err, path) {
  if (err) 
		throw err;
	Database.create(path+'/tdtest')
	.then(db=>{
		const session = new DbSession(db);
		const ctx = session.ctx;
    jelAssert.setCtx(ctx);
		
		describe('Class', function() {
      it('can be created and serialized', function() {
        jelAssert.equal('Class("MyTestType").methods.size', 0);
        jelAssert.equal('Class("MyTestType", methods={add: ()=>2}).methods.size', 1);
        jelAssert.equal('Class("MyTestType", null, (x,y)=>{}, {a: Float, b: String}, {add: ()=>this.a+this.b})', 
                        'Class(className="MyTestType", constructor=(x,y)=>{}, propertyDefs={a: Float, b: String}, methods={add: ()=>this.a+this.b})');
      });

      it('can be created using the JEL syntax', function() {
        jelAssert.equal('class MyTestType:', 'Class("MyTestType")');
        jelAssert.equal('class MyTestType: add()=> 2', 'Class("MyTestType", methods={add: ()=>2})');
        jelAssert.equal('class MyTestType: constructor(x, y)=> {} a: Float b: String add()=>this.a+this.b', 
                        'Class("MyTestType", constructor=(x,y)=>{}, propertyDefs={a: SimpleType("Float"), b: SimpleType("String")}, methods={add: ()=>this.a+this.b})');
        jelAssert.equal('class MyTestType constructor(x, y)=>{} a: Float b: String add()=>this.a+this.b', 
                        'class MyTestType: constructor(x, y)=>{} a: Float b: String add()=> this.a+this.b');
      });

      it('supports properties set in the constructor', function() {
        jelAssert.equal('let myTestType=Class("MyTestType", null, (x: Float, y: String)=>{}), m=myTestType(5, "foo"): [m.x, m.y]', "[5, 'foo']");
        jelAssert.equal('let myTestType=Class("MyTestType", null, (x: Float|String, y: Float|String)=>{}), m=myTestType(5, "foo"): [m.x, m.y]', "[5, 'foo']");
        jelAssert.equal('let myTestType=Class("MyTestType", null, (x: Float, y: String)=>{}), m=myTestType(5, "foo"): [m.x, m.y]', "[5, 'foo']");
        jelAssert.equal('let myTestType=Class("MyTestType", null, (x: Float, y: Float)=>{z: x+y}, propertyDefs={z: SimpleType("Float")}), m=myTestType(5, 10): [m.x, m.y, m.z]', "[5, 10, 15]");
        jelAssert.equal('let myTestType=Class("MyTestType", constructor=(x: Float, y: String)=>{x: x+1}), m=myTestType(5, "foo"): [m.x, m.y]', "[6, 'foo']");
        jelAssert.equal('let myTestType=Class("MyTestType", null, (x: Float, y: String)=>{}), m=myTestType(y="foo", x=2): [m.x, m.y]', "[2, 'foo']");

        jelAssert.equal('let myTestType=class MyTestType: constructor(x: Float, y: String)=>{}, m=myTestType(y="foo", x=2): [m.x, m.y]', "[2, 'foo']");
        jelAssert.equal('let myTestType=class MyTestType: x: int constructor()=>{x: 5}, m=myTestType(): m.x', "5");
        jelAssert.equal('let myTestType=class MyTestType: x: int = 17 constructor()=>{}, m=myTestType(): m.x', "17");
        jelAssert.equal('let myTestType=class MyTestType: x: int = 15 constructor()=>{x:17}, m=myTestType(): m.x', "17");

        return Promise.all([jelAssert.errorPromise('let myTestType=Class("MyTestType", null, (x,y)=>{}, {x: Float, y: String}), m=myTestType("wrong type", "foo"): [m.x, m.y]'),
                            jelAssert.errorPromise('let myTestType=Class("MyTestType", null, (x: Float, y: String)=>{}), m=myTestType("wrong type", "foo"): [m.x, m.y]'),
                            jelAssert.errorPromise('let myTestType=Class("MyTestType", null, (x,y)=>{}, {x: Float, y: String}), m=myTestType(): [m.x, m.y]'),
                            jelAssert.errorPromise('let myTestType=class MyTestType: x: int constructor()=>{x: 0.5}, m=myTestType(): m.x'),
                           jelAssert.errorPromise('let myTestType=class MyTestType: constructor()=>{x: 0.5}: myTestType()')]);
      });

      it('supports methods', function() {
        jelAssert.equal('let myTestType=Class("MyTestType", null, (x: Float, y: Float)=>{}, methods={add: ()=>this.x+this.y}), m=myTestType(5, 12): m.add()', "17");
        jelAssert.equal('let myTestType=Class("MyTestType", null, (x: Float, y: Float)=>{}, methods={add: (a, b)=>this.x+this.y+a/b}), m=myTestType(5, 12): m.add(20, 4)', "22");
        jelAssert.equal('let myTestType=Class("MyTestType", null, (x: Float, y: Float)=>{}, methods={add: (a, b)=>this.x+this.y+a/b}), m=myTestType(5, 12): m.add(b=4, a=20)', "22");
        jelAssert.equal('let myTestType=Class("MyTestType", null, (x: Float, y: Float)=>{}, methods={add: (a=20, b=4)=>this.x+this.y+a/b}), m=myTestType(5, 12): m.add()', "22");
        jelAssert.equal('let myTestType=Class("MyTestType", null, (x: Float, y: Float)=>{}, methods={add: (a, b)=>this.x+this.y+a/b}), m=myTestType(15, 12), add=m.add: add(b=4, a=20)', "32");

        jelAssert.equal('let myTestType=class MyTestType: constructor(x: Float, y: Float) => {} add(a, b)=>this.x+this.y+a/b, m=myTestType(15, 12), add=m.add: add(b=4, a=20)', "32");
        jelAssert.equal('let myTestType=class MyTestType: constructor(x: Float, y: Float) => {} add(a, b): Float=>this.x+this.y+a/b, m=myTestType(15, 12), add=m.add: add(b=4, a=20)', "32");
        
        jelAssert.equal('let myTestType=Class("MyTestType", null, ()=>{}, methods={div: (a, b)=>a/b}), m=myTestType(), div=m.div: m.div(60, 10) + div(40, 10)', "10");
      });

      it('supports packages', function() {
        jelAssert.equal('let myTestType=Class("My::Test::Type"): myTestType.packageName', "'My::Test'");
        jelAssert.equal('let myTestType=class My::Test::Type: : myTestType.packageName', "'My::Test'");
      });

      it('supports serialization of instances', function() {
        const ctx2 = ctx.plus({MyType: new JEL('class MyType: constructor(a, b, c)=>{}').executeImmediately(ctx)});
        const serialized = Serializer.serialize(new JEL('MyType(4, 1, 6)').executeImmediately(ctx2));
        const obj = new JEL(serialized).executeImmediately(ctx2);
        assert.equal(obj.props.elements.get('a'), 4);
        assert.equal(obj.props.elements.get('c'), 6);
      });
      
      it('supports superTypes', function() {
        jelAssert.equal(`let superType=class SuperType: constructor(x: Float, y: Float)=> {} add(a, b=1)=>a+b sub(a, b=1)=>a-b,
                              subType=class SubType extends superType: constructor(x: Float, y: Float, z: Float)=> {} override add(a,b=2)=>a+b+10 mul(a,b=1)=>a*b,
                              s1 = superType(4, 6),
                              s2 = subType(8, 10, 20): 
                            [s1.x, s1.y, s2.x, s2.y, s2.z, s1.add(5), s1.sub(4), s2.add(6), s2.sub(33), s2.mul(9, 9)]`, "[4, 6, 8, 10, 20, 6, 3, 18, 32, 81]");

        jelAssert.equal(`let superType=class SuperType: a=1 constructor()=>{}, subType=class SubType extends superType: b=1 constructor()=>{}, other=class Other: c=1 constructor()=>{},
                          super1=superType(), sub1=subType(), o=other():
                            [super1 instanceof superType, super1 instanceof subType, super1 instanceof other,
                             sub1 instanceof superType, sub1 instanceof subType, sub1 instanceof other,
                             o instanceof superType, o instanceof subType, o instanceof other]`, "[true, false, false, true, true, false, false, false, true]");
      });
      
      it('supports abstract superTypes', function() {
        jelAssert.equal(`let superType=abstract class SuperType: a=1 constructor(x=1)=>{a:x+5} abstract test(), subType=class SubType extends superType: constructor()=>super(9) override test()=>1, sub1=subType():
                            [sub1.a, sub1.test()]`, "[14,1]");
        return Promise.all([
          jelAssert.errorPromise(`let s = abstract class AC: constructor()=>{} : s()`, 'declared abstract')   //,
//          jelAssert.errorPromise(`let superType=abstract class SuperType: a=1 constructor(x=1)=>{a:x+5} abstract test(), subType=class SubType extends superType: constructor()=>super(9): subType()`, 'XX must override')
        ]);
      });
      
      it('allows overriding methods', function() {
        jelAssert.equal(`let superType=class SuperType: constructor()=>{} incX(x)=>x+1, subType=class SubType extends superType: constructor()=>{} override incX(x)=>x+2, sup1=superType(), sub1=subType():
                            [sup1.incX(5), sub1.incX(10)]`, "[6, 12]");
        jelAssert.equal(`let superType=class SuperType: constructor()=>{} incX(x): int=> x+1, subType=class SubType extends superType: constructor()=>{} override incX(x):int=>x+2, sup1=superType(), sub1=subType():
                            [sup1.incX(5), sub1.incX(10)]`, "[6, 12]");
        
        return Promise.all([
          jelAssert.errorPromise(`let superType=abstract class SuperType: incX(x: int)=>x+1, subType=class SubType extends superType: constructor()=>{} override incX(x: number)=>x+2: subType()`, 'number'),
          jelAssert.errorPromise(`let superType=abstract class SuperType: incX(x: int)=>x+1, subType=class SubType extends superType: constructor()=>{} override incX(ypsilon: int)=>x+2: subType()`, 'ypsilon'),
          jelAssert.errorPromise(`let superType=abstract class SuperType: incX(a,b,c,d,e,f)=>a+1, subType=class SubType extends superType: constructor()=>{} override incX(a,b,c,d,e,f,g)=>a+2: subType()`, '7'),
          jelAssert.errorPromise(`let superType=abstract class SuperType: incX(x: int)=>x+1, subType=class SubType extends superType: constructor()=>{} override incX(x: any)=>x+2: subType()`, 'any'),
          jelAssert.errorPromise(`let superType=abstract class SuperType: incX(x):number=> x+1, subType=class SubType extends superType: constructor()=>{} override incX(x):int=> x+2: subType()`, 'return type'),
          jelAssert.errorPromise(`let superType=class SuperType: constructor()=>{} incX(x)=>x+1, subType=class SubType extends superType: constructor()=>{} incX(x)=>x+2: subType()`, `method needs an 'override'`)
          ]);
      });

      
      it('supports static properties', function() {
        jelAssert.equal('let myTestType=Class("MyTestType", staticValues={add: (a,b)=>a+b, ft: 42}): myTestType.ft + myTestType.add(1, 2)', "45");
        jelAssert.equal('let myTestType=class MyTestType: static add(a,b):Float=>a+b static ft = 42: myTestType.ft + myTestType.add(1, 2)', "45");
      });
      
      it('supports static properties that use the constructor or other elements', function() {
        jelAssert.equal('let myTestType=class MyTestType1: static ft = 44 static ft1=MyTestType1.ft+1: myTestType.ft1', "45");
        jelAssert.equal('let myTestType=class MyTestType2: static add(a,b): number=>a+b static ft = MyTestType2.add(1, 3): myTestType.ft', "4");
        jelAssert.equal('let myTestType=class MyTestType3: constructor(a: int)=> {} static ft = MyTestType3(42): myTestType.ft.a', "42");
        jelAssert.equal('let myTestType=class MyTestType4: x: int constructor()=> {x: MyTestType4.X} static X = 100: myTestType().x', "100");
        jelAssert.equal('let myTestType=class MyTestType4: x: int constructor()=> {x: this.X} static X = 100: myTestType().x', "100");
      });
      
      it('supports getter', function() {
        jelAssert.equal('let myTestType=Class("MyTestType", null, (x: Float, y: Float)=>{}, getters={x: ()=>8, z: ()=>4}), m=myTestType(5, 12): m.x/m.z', "2");
        jelAssert.equal('let myTestType=class MyTestType: constructor(x: Float, y: Float)=>{} get x():Float=>8 get z()=>4, m=myTestType(5, 12): m.x/m.z', "2");

        jelAssert.equal(`let superType=class SuperType: constructor()=>{} get x()=>1, subType=class SubType extends superType: constructor()=>{} override get x()=>42, sup1=superType(), sub1=subType():
                            [sup1.x, sub1.x]`, "[1, 42]");
        
        return jelAssert.errorPromise(`let superType=class SuperType: constructor()=>{} get x()=>1, subType=class SubType extends superType: constructor()=>{} get x()=>2: subType()`, `Missing 'override' modifier`);
      });

      it('supports ops', function() {
        jelAssert.equal('let myTestType=Class("MyTestType", null, (x: Float)=>{}, methods={"op+": (right)=>myTestType(this.x+right)}), m=myTestType(5): (m+10).x', "15");
        jelAssert.equal('let myTestType=Class("MyTestType", null, (x: Float)=>{}, methods={"singleOp-": ()=>myTestType(-this.x*2)}), m=myTestType(5): (-m).x', "-10");
        
        jelAssert.equal('let myTestType=class MyTestType: constructor(x: Float)=>{} op+(right)=> myTestType(this.x+right), m=myTestType(5): (m+10).x', "15");
        jelAssert.equal('let myTestType=class MyTestType: constructor(x: Float)=>{} op+(right):Float=> this.x+right, m=myTestType(5): m+10', "15");
      });

      it('can be loaded from DB and used like a real type', function() {
        return db.put(ctx, new JEL('class TupleXY: constructor(x: Float, y: Float)=>{}  add()=>this.x+this.y static A= 44').executeImmediately(ctx))
          .then(()=>Promise.all([jelAssert.equalPromise('TupleXY(7, 10).add()', "17"),
                             jelAssert.equalPromise('TupleXY.A', "44"),
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
      HybridNativeTest.y_jel_mapping = true;
      HybridNativeTest.y = 100;
      BaseTypeRegistry.register('HybridNativeTest', HybridNativeTest);
      
      it('supports hybrid native classes', function() {
        jelAssert.equal(`let c=(class HybridNativeTest:\n constructor()=>{}\n static native y: int\n native add(a: int, b: int): int\n static native sub(a,b)):
                          [c.y, c().add(3, 4), c.sub(2, 1)]`, `[100, 7, 1]`);
      });

      class FullNativeTest extends JelObject {
        constructor(clazz, n) {
          super(clazz.className, clazz);
          this.x = n;
        }

        add(ctx, a,b) {
          return a.value + b.value;
        }

        static sub(ctx, a,b) {
          return a.value - b.value;
        }
        
        static create(ctx, a) {
          return new FullNativeTest(this, 42 + (a.value||0));
        }
      }
      FullNativeTest.prototype.x_jel_mapping = true;
      FullNativeTest.prototype.add_jel_mapping = true;
      FullNativeTest.sub_jel_mapping = true;
      FullNativeTest.create_jel_mapping = true;
      FullNativeTest.y_jel_mapping = true;
      FullNativeTest.y = 100;
      BaseTypeRegistry.register('FullNativeTest', FullNativeTest);

      it('supports fully native classes', function() {
        jelAssert.equal(`let c=(native class FullNativeTest:\n native constructor(a: int)\n native x: int\n static native y: int\n native add(a: int, b: int): int\n static native sub(a,b)):
                          [c.y, c(0).add(3, 4), c.sub(2, 1), c(0).x, c(1).x]`, `[100, 7, 1, 42, 43]`);
      });
    });

	});
});