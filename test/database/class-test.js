'use strict';

require('source-map-support').install();
const Database = require('../../build/database/Database.js').default;
const DbSession = require('../../build/database/DbSession.js').default;
const DatabaseContext = require('../../build/database/DatabaseContext.js').default;
const DbRef = require('../../build/database/DbRef.js').default;
const Class = require('../../build/database/dbObjects/Class.js').default;
const JEL = require('../../build/jel/JEL.js').default;
const Context = require('../../build/jel/Context.js').default;
const DefaultContext = require('../../build/jel/DefaultContext.js').default;
const Util = require('../../build/util/Util.js').default;
const JelNumber = require('../../build/jel/types/JelNumber.js').default;
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
        jelAssert.equal('Class("MyTestType", null, (x,y)=>{}, {a: Number, b: String}, {add: ()=>this.a+this.b})', 
                        'Class(className="MyTestType", constructor=(x,y)=>{}, propertyDefs={a: Number, b: String}, methods={add: ()=>this.a+this.b})');
      });

      it('supports properties set in the constructor', function() {
        jelAssert.equal('with myTestType=Class("MyTestType", null, (x: Number, y: String)=>{}), m=myTestType(5, "foo"): [m.x, m.y]', "[5, 'foo']");
        jelAssert.equal('with myTestType=Class("MyTestType", null, (x: Number|String, y: Number|String)=>{}), m=myTestType(5, "foo"): [m.x, m.y]', "[5, 'foo']");
        jelAssert.equal('with myTestType=Class("MyTestType", null, (x: Number, y: String)=>{}), m=myTestType(5, "foo"): [m.x, m.y]', "[5, 'foo']");
        jelAssert.equal('with myTestType=Class("MyTestType", null, (x: Number, y: Number)=>{z: x+y}, propertyDefs={z: Number}), m=myTestType(5, 10): [m.x, m.y, m.z]', "[5, 10, 15]");
        jelAssert.equal('with myTestType=Class("MyTestType", constructor=(x: Number, y: String)=>{x: x+1}), m=myTestType(5, "foo"): [m.x, m.y]', "[6, 'foo']");
        jelAssert.equal('with myTestType=Class("MyTestType", null, (x: Number, y: String)=>{}), m=myTestType(y="foo", x=2): [m.x, m.y]', "[2, 'foo']");
        return Promise.all([jelAssert.errorPromise('with myTestType=Class("MyTestType", null, (x,y)=>{}, {x: Number, y: String}), m=myTestType("wrong type", "foo"): [m.x, m.y]', "[2, 'foo']"),
                            jelAssert.errorPromise('with myTestType=Class("MyTestType", null, (x: Number, y: String)=>{}), m=myTestType("wrong type", "foo"): [m.x, m.y]', "[2, 'foo']"),
                            jelAssert.errorPromise('with myTestType=Class("MyTestType", null, (x,y)=>{}, {x: Number, y: String}), m=myTestType(): [m.x, m.y]', "[2, 'foo']")]);
      });

      it('supports methods', function() {
        jelAssert.equal('with myTestType=Class("MyTestType", null, (x: Number, y: Number)=>{}, methods={add: ()=>this.x+this.y}), m=myTestType(5, 12): m.add()', "17");
        jelAssert.equal('with myTestType=Class("MyTestType", null, (x: Number, y: Number)=>{}, methods={add: (a, b)=>this.x+this.y+a/b}), m=myTestType(5, 12): m.add(20, 4)', "22");
        jelAssert.equal('with myTestType=Class("MyTestType", null, (x: Number, y: Number)=>{}, methods={add: (a, b)=>this.x+this.y+a/b}), m=myTestType(5, 12): m.add(b=4, a=20)', "22");
        jelAssert.equal('with myTestType=Class("MyTestType", null, (x: Number, y: Number)=>{}, methods={add: (a=20, b=4)=>this.x+this.y+a/b}), m=myTestType(5, 12): m.add()', "22");
        jelAssert.equal('with myTestType=Class("MyTestType", null, (x: Number, y: Number)=>{}, methods={add: (a, b)=>this.x+this.y+a/b}), m=myTestType(15, 12), add=m.add: add(b=4, a=20)', "32");
        jelAssert.equal('with myTestType=Class("MyTestType", null, ()=>{}, methods={div: (a, b)=>a/b}), m=myTestType(), div=m.div: m.div(60, 10) + div(40, 10)', "10");
      });

      it('supports packages', function() {
        jelAssert.equal('with myTestType=Class("My::Test::Type"): myTestType.packageName', "'My::Test'");
      });
      
      it('supports superTypes', function() {
        jelAssert.equal(`with superType=Class("SuperType", null, (x: Number, y: Number)=>{}, methods={add: (a, b=1)=>a+b, sub: (a, b=1)=>a-b}),
                              subType=Class("SubType", superType, (x: Number, y: Number, z: Number)=>{}, methods={add: (a,b=2)=>a+b+10, mul: (a,b=1)=>a*b}),
                              s1 = superType(4, 6),
                              s2 = subType(8, 10, 20): 
                            [s1.x, s1.y, s2.x, s2.y, s2.z, s1.add(5), s1.sub(4), s2.add(6), s2.sub(33), s2.mul(9, 9)]`, "[4, 6, 8, 10, 20, 6, 3, 18, 32, 81]");
      });
      
      it('supports static properties', function() {
        jelAssert.equal('with myTestType=Class("MyTestType", static={add: (a,b)=>a+b, ft: 42}): myTestType.ft + myTestType.add(1, 2)', "45");
      });
      
      it('supports getter', function() {
        jelAssert.equal('with myTestType=Class("MyTestType", null, (x: Number, y: Number)=>{}, getters={x: ()=>8, z: ()=>4}), m=myTestType(5, 12): m.x/m.z', "2");
      });

      it('supports ops', function() {
        jelAssert.equal('with myTestType=Class("MyTestType", null, (x: Number)=>{}, methods={"op+": (right)=>myTestType(this.x+right)}), m=myTestType(5): (m+10).x', "15");
        jelAssert.equal('with myTestType=Class("MyTestType", null, (x: Number)=>{}, methods={"opReversed+": (left)=>myTestType(this.x+left)}), m=myTestType(5): (10+m).x', "15");
        jelAssert.equal('with myTestType=Class("MyTestType", null, (x: Number)=>{}, methods={"singleOp-": ()=>myTestType(-this.x*2)}), m=myTestType(5): (-m).x', "-10");
      });

      it('can be loaded from DB and used like a real type', function() {
        return db.put(ctx, new JEL('Class("TupleXY", null, (x: Number, y: Number)=>{}, methods={add: ()=>this.x+this.y}, static={A: 44})').executeImmediately(ctx))
          .then(()=>Promise.all([jelAssert.equalPromise('TupleXY(7, 10).add()', "17"),
                             jelAssert.equalPromise('TupleXY.A', "44"),
                             jelAssert.equalPromise('TupleXY(x=7, y=1) instanceof @TupleXY', "true")]));
      });
      
    });

	});
});