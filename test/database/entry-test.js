'use strict';

require('source-map-support').install();
const Database = require('../../build/database/Database.js').default;
const DbSession = require('../../build/database/DbSession.js').default;
const DbRef = require('../../build/database/DbRef.js').default;
const Category = require('../../build/database/dbObjects/Category.js').default;
const Thing = require('../../build/database/dbObjects/Thing.js').default;
const JEL = require('../../build/jel/JEL.js').default;
const Context = require('../../build/jel/Context.js').default;
const DefaultContext = require('../../build/jel/DefaultContext.js').default;
const Util = require('../../build/util/Util.js').default;
const Float = require('../../build/jel/types/Float.js').default;
const JelString = require('../../build/jel/types/JelString.js').default;
const Dictionary = require('../../build/jel/types/Dictionary.js').default;
const EnumValue = require('../../build/jel/types/EnumValue.js').default;
const assert = require('assert');
const {JelAssert, JelPromise, JelConsole} = require('../jel-assert.js');
const jelAssert = new JelAssert(DefaultContext.get());

const path = 'build/tmp/entrytestdbs';

describe('Database entries', function() {

  let db, session, ctx;
  before(function() {
    return Database.create(path)
      .then(newdb=>{
        db = newdb;
        return DbSession.create(db).then(s=>{
          session = s;
          ctx = s.ctx;
          jelAssert.setCtx(ctx);
        })
      });
  });

 
  describe('Category', function() {
    it('must end with "Category"', function() {
      assert.throws(()=>new Category('NoThings'));
    });

    it('finds no instances', function() {
      const cat = new Category('NoThingsCategory');
      return session.put(cat)
        .then(()=>cat.getInstances(ctx))
        .then(instances=>assert.deepEqual(instances, []));
    });

    it('finds instances', function() {
      const cat = new Category('MyCategory');
      const subCat = new Category('MySubCategory', cat);
      const thing = new Thing('MyThing1', cat);
      const thing2 = new Thing('MyThing2', cat);
      const thing3 = new Thing('MyThing3', subCat);
      return session.put(cat, subCat, thing, thing2, thing3)
        .then(()=>cat.getInstances(ctx))
        .then(instances=>{
          assert.deepEqual(instances.map(d=>d.distinctName).sort(), ['MyThing1', 'MyThing2', 'MyThing3']);

        cat.getInstances(ctx) // this time cached...
        .then(instances2=>assert.deepEqual(instances2.map(d=>d.distinctName).sort(), ['MyThing1', 'MyThing2', 'MyThing3']));	
      });
    });

    it('supports category-level properties', function() {
      const animal = new Category('Animal1Category', undefined, Dictionary.fromObject({a: Float.valueOf(1), b: Float.valueOf(2), x: JelString.valueOf("foo"), y: JelString.valueOf("bar")}));
      const cat = new Category('Cat1Category', animal, Dictionary.fromObject({a: Float.valueOf(5), c: Float.valueOf(3), x: JelString.valueOf("bla"), z: JelString.valueOf("nope")}));
      return db.put(ctx, animal, cat)
      .then(()=>session.getFromDatabase('Cat1Category') 
        .then(cc=>{
          assert.ok(!!cc);
          jelAssert.equal(cc.member(ctx, 'a'), 5);
          jelAssert.equal(cc.member(ctx, 'c'), 3);
          jelAssert.equal(cc.member(ctx, 'x'), "'bla'");
          jelAssert.equal(cc.member(ctx, 'z'), "'nope'");

          return Promise.all([
            Promise.resolve(cc.member(ctx, 'b')).then(value=>jelAssert.equal(value, 2)),
            Promise.resolve(cc.member(ctx, 'y')).then(value=>jelAssert.equal(value, "'bar'")),
            JEL.execute('@Cat1Category.a', ctx).then(r=>jelAssert.equal(r, 5)),
            JEL.execute('@Cat1Category.y', ctx).then(r=>jelAssert.equal(r, "'bar'"))
            ])
          .then(()=>session.getFromDatabase('Animal1Category'));
        })
        .then(aa=> {
          assert.ok(!!aa);
          jelAssert.equal(aa.member(ctx, 'a'), 1);
          jelAssert.equal(aa.member(ctx, 'b'), 2);
          jelAssert.equal(aa.member(ctx, 'x'), "'foo'");
          jelAssert.equal(aa.member(ctx, 'y'), "'bar'");
          return Promise.all([
            JEL.execute('@Animal1Category.a', ctx).then(r=>jelAssert.equal(r, 1)),
            JEL.execute('@Animal1Category.b', ctx).then(r=>jelAssert.equal(r, '2'))
            ])
        }));
    });

    it('supports instance properties', function() {
      const e1 = new EnumValue('required', DbRef.create('PropertyTypeEnum'));
      const e2 = new EnumValue('optional', DbRef.create('PropertyTypeEnum'));
      const animal = new Category('Animal2Category', undefined, undefined,
                                Dictionary.fromObject({a: Float.valueOf(1), b: Float.valueOf(2)}));
      const cat = new Category('Cat2Category', animal, undefined, 
                              Dictionary.fromObject({a: Float.valueOf(7), c: Float.valueOf(3)}));

      return db.put(ctx, animal, cat)
      .then(()=>session.getFromDatabase('Cat2Category') 
        .then(cc=>{
          assert.ok(!!cc);
          assert.equal(cc.instanceDefault(ctx, 'a'), Float.valueOf(7));
          assert.equal(cc.instanceDefault(ctx, 'c'), Float.valueOf(3));
          assert.equal(cc.superCategory.distinctName, 'Animal2Category');

          return Promise.all([
            Promise.resolve(cc.instanceDefault(ctx, 'b')).then(value=>jelAssert.equal(value, 2))
            ])
          .then(()=>session.getFromDatabase('Animal2Category'));
        })
        .then(aa=> {
          assert.ok(!!aa);
          assert.equal(aa.instanceDefault(ctx, 'a'), Float.valueOf(1));
          assert.equal(aa.instanceDefault(ctx, 'b'), Float.valueOf(2));
          return Promise.all([
            Promise.resolve(aa.instanceDefault(ctx, 'b')).then(value=>jelAssert.equal(value, 2))
            ])
        }));
    });

    it('supports isExtending', function() {
      const lf = new Category('LifeFormCategory');
      const animal = new Category('Animal5Category', lf);
      const cat = new Category('Cat5Category', animal);

      assert.equal(animal.isExtending(ctx, 'LifeFormCategory').state, 1);
      assert.equal(animal.isExtending(ctx, 'Animal5Category').state, 0);
      assert.equal(animal.isExtending(ctx, 'Cat5Category').state, 0);

      assert.equal(lf.isExtending(ctx, 'LifeFormCategory').state, 0);
      assert.equal(lf.isExtending(ctx, 'Animal5Category').state, 0);

      assert.equal(cat.isExtending(ctx, 'LifeFormCategory').state, 1);
      assert.equal(cat.isExtending(ctx, 'Animal5Category').state, 1);
      assert.equal(cat.isExtending(ctx, 'Cat5Category').state, 0);
      assert.equal(cat.isExtending(ctx, 'Cow').state, 0);
    });

  });


  describe('Thing', function() {
    it('supports thing-level properties', function() {
      const animal = new Category('Animal5Category', undefined, undefined, Dictionary.fromObject({a: Float.valueOf(1), b: Float.valueOf(2), x: JelString.valueOf("foo"), y: JelString.valueOf("bar")}));
      jelAssert.equal(animal.instanceDefault(ctx, 'a'), 1);
      const cat = new Category('Cat5Category', animal, undefined, Dictionary.fromObject({a: Float.valueOf(5), c: Float.valueOf(3), x: JelString.valueOf("bla"), z: JelString.valueOf("nope")}));
      jelAssert.equal(cat.instanceDefault(ctx, 'a'), 5);

      const grumpy = new Thing('GrumpyCat', cat, Dictionary.fromObject({b: Float.valueOf(3), d: Float.valueOf(5), x: JelString.valueOf("bar"), w: JelString.valueOf("www")}));
      jelAssert.equal(grumpy.properties.get(ctx, 'b'), 3);
      jelAssert.equal(grumpy.member(ctx, 'b'), 3);

      const howard = new Thing('HowardTheDuck', animal);
      const mred = new Thing('MrEd', animal, Dictionary.fromObject({a: 3, d: 5, x: JelString.valueOf("bar"), w: JelString.valueOf("www")}));
      return db.put(ctx, animal, cat, grumpy, howard, mred)
      .then(()=>session.getFromDatabase('GrumpyCat') 
        .then(cc=>{
          assert.ok(!!cc);
          jelAssert.equal(cc.properties.get(ctx, 'b'), 3);
          jelAssert.equal(cc.member(ctx, 'b'), 3);
          jelAssert.equal(cc.member(ctx, 'd'), 5);
          jelAssert.equal(cc.member(ctx, 'x'), "'bar'");
          jelAssert.equal(cc.member(ctx, 'w'), "'www'");

          return Promise.all([
            Promise.resolve(cc.member(ctx, 'a')).then(value=>jelAssert.equal(value, 5)),
            Promise.resolve(cc.member(ctx, 'c')).then(value=>jelAssert.equal(value, 3)),
            Promise.resolve(cc.member(ctx, 'y')).then(value=>jelAssert.equal(value, "'bar'")),
            Promise.resolve(cc.member(ctx, 'z')).then(value=>jelAssert.equal(value, "'nope'"))
          ])
          .then(()=>session.getFromDatabase('HowardTheDuck'));
        })
        .then(cc=>{
          assert.ok(!!cc);
          return Promise.all([
            Promise.resolve(cc.member(ctx, 'a')).then(value=>jelAssert.equal(value, 1)),
            JEL.execute('@HowardTheDuck.a', ctx).then(r=>jelAssert.equal(r, 1)),
            Promise.resolve(cc.member(ctx, 'b')).then(value=>jelAssert.equal(value, 2)),
            Promise.resolve(cc.member(ctx, 'x')).then(value=>jelAssert.equal(value, "'foo'")),
            Promise.resolve(cc.member(ctx, 'y')).then(value=>jelAssert.equal(value, "'bar'"))
          ])
          .then(()=>session.getFromDatabase('MrEd'));
        })
        .then(cc=> {
          assert.ok(!!cc);
          jelAssert.equal(cc.member(ctx, 'a'), 3);
          jelAssert.equal(cc.member(ctx, 'd'), 5);
          jelAssert.equal(cc.member(ctx, 'x'), "'bar'");
          jelAssert.equal(cc.member(ctx, 'w'), "'www'");
          return Promise.all([
            Promise.resolve(cc.member(ctx, 'b')).then(value=>jelAssert.equal(value, 2)),
            Promise.resolve(cc.member(ctx, 'y')).then(value=>jelAssert.equal(value, "'bar'"))
          ]);
        }));
    });

    it('supports isA', function() {
      const lf = new Category('LifeFormCategory');
      const animal = new Category('Animal5Category', lf);
      const cat = new Category('Cat5Category', animal);
      const grumpy = new Thing('GrumpyCat', cat);
      const rnd = new Thing('RandomAnimal', animal);
      const al = new Thing('Alien', lf);		

      assert.equal(al.isA(ctx, 'LifeFormCategory').state, 1);
      assert.equal(al.isA(ctx, 'Cat5Category').state, 0);

      assert.equal(rnd.isA(ctx, 'LifeFormCategory').state, 1);
      assert.equal(rnd.isA(ctx, 'Animal5Category').state, 1);
      assert.equal(rnd.isA(ctx, 'Cat5Category').state, 0);

      assert.equal(grumpy.isA(ctx, 'LifeFormCategory').state, 1);
      assert.equal(grumpy.isA(ctx, 'Animal5Category').state, 1);
      assert.equal(grumpy.isA(ctx, 'Cat5Category').state, 1);
      assert.equal(grumpy.isA(ctx, 'Cow').state, 0);
    });
  });


});
  