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
  