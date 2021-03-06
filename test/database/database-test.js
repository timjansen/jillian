'use strict';

require('source-map-support').install();
const Database = require('../../build/database/Database.js').default;
const Loader = require('../../build/database/Loader.js').default;
const DbSession = require('../../build/database/DbSession.js').default;
const DatabaseContext = require('../../build/database/DatabaseContext.js').default;
const DatabaseConfig = require('../../build/database/DatabaseConfig.js').default;
const DbEntry = require('../../build/database/DbEntry.js').default;
const NotFoundError = require('../../build/database/NotFoundError.js').default;
const Thing = require('../../build/database/dbObjects/Thing.js').default;
const Category = require('../../build/database/dbObjects/Category.js').default;
const Context = require('../../build/jel/Context.js').default;
const Dictionary = require('../../build/jel/types/Dictionary.js').default;
const DefaultContext = require('../../build/jel/DefaultContext.js').default;
const fs = require('fs');
const assert = require('assert');
const {JelAssert, JelPromise, JelConsole} = require('../jel-assert.js');

const jelAssert = new JelAssert();

const path = 'build/tmp/testdbs';

describe('database', function() {
  let ctx;
  before(function(){
    return DefaultContext.get().then(dc=> {
      ctx = dc;
      jelAssert.setCtx(ctx);
    });
  });
  
  it('creates a database', function() {
    return Database.create(path+'/db1', new DatabaseConfig(Dictionary.fromObject({sizing: 99}).elements))
    .then(db=>{
      assert(fs.existsSync(path+'/db1'));
      assert(fs.existsSync(path+'/db1/dbconfig.jel'));
      assert(fs.existsSync(path+'/db1/data'));
      return db.init(config=>assert.equal(db.config.sizing, 99));
    });
  });

  it('re-opens a database', function() {
    return Database.create(path+'/db2', new DatabaseConfig(Dictionary.fromObject({sizing: 999}).elements))
    .then(()=>{
      const db = new Database(path+'/db2');
      return db.init(config=>{
        assert.equal(config, db.config);
        assert.equal(config.sizing, 999);
      });
    });
  });

  it('get rejects when requesting DB entries that do not exist', function() {
    return Database.create(path+'/db3')
    .then(db=>DbSession.create(db).then(session=>
          Promise.all([db.get(session.ctx, 'doesNotExist')
                           .then(a=>assert.fail('should never get called (doesNotExist), got ' + a))
                           .catch(results=>assert.deepEqual(results, new NotFoundError('doesNotExist'))),
                           db.getByHash(session.ctx, '0000000000000000')
                           .then(a=>assert.fail('should never get called (0000000000000000), got ' + a))
                           .catch(results=>assert.deepEqual(results, new NotFoundError('0000000000000000')))
    ])));
  });

  it('getIfFound() returns null when not found', function() {
    return Database.create(path+'/db4')
      .then(db=>DbSession.create(db).then(session=>
          db.getIfFound(session.ctx, 'doesNotExist)'))
        .then(results=>assert.deepEqual(results, null)));
  });


  it('loads and stores DB entries', function() {
    return Database.create(path+'/db5')
    .then(db=>DbSession.create(db).then(session=>{
      const ctx = session.ctx;
      const e = DbEntry.valueOf('MyFirstEntry');
      assert.equal(e.hashCode.length, 16);
      return db.put(ctx, e).then(()=>db.get(ctx, 'MyFirstEntry').then(e1=>{
        assert.equal(e1.constructor.name, 'DbEntry');
        assert.equal(e1.distinctName, 'MyFirstEntry');
        return db.getByHash(ctx, e.hashCode).then(e2=>{
          assert.equal(e2.distinctName, 'MyFirstEntry');
          const db2 = new Database(path+'/db5');
          return db2.get(ctx, 'MyFirstEntry').then(e1=>assert.equal(e1.distinctName, 'MyFirstEntry'));
        });
      }));
    }))
    .then(()=>{
      const db = new Database(path+'/db5');
      return DbSession.create(db).then(session=>{
        const ctx = session.ctx;
        const a = DbEntry.valueOf('MyOtherEntry');
        return db.put(ctx, a)
          .then(()=>db.getIfFound(ctx, 'MyOtherEntry').then(a1=>assert.equal(a1.distinctName, 'MyOtherEntry')))
          .then(()=>db.get(ctx, 'MyFirstEntry').then(e1=>assert.equal(e1.distinctName, 'MyFirstEntry')));
      });
    });
  });

  it('overwrites DB entries', function() {
    return Database.create(path+'/db6')
    .then(db=>DbSession.create(db).then(session=>{
        const ctx = session.ctx;
        const e = DbEntry.valueOf('MyEntry');
        return db.put(ctx, e)
          .then(()=>db.get(ctx, 'MyEntry')
                .then(e2=>{e2.distinctName='x';return db.put(ctx, e2)})
                .then(()=>db.getByHash(ctx, e.hashCode))
                .then(e3=>assert.equal(e3.distinctName, 'x'))
               );
    }));
  });

  it('deletes DB entries', function() {
    return Database.create(path+'/db7')
      .then(db=>DbSession.create(db).then(session=>{
          const ctx = session.ctx;
          const e = DbEntry.valueOf('MyEntry');
          return db.put(ctx, e)
            .then(()=>db.delete(ctx, e))
            .then(()=>db.getIfFound(ctx, 'MyEntry'))
            .then(e2=>assert.strictEqual(e2, null));
    }));
  });

  it('maintains a category index', function() {
    return Database.create(path+'/db8')
      .then(db=>DbSession.create(db).then(session=>{
        const ctx = session.ctx;

        const superC = new Category('SuperCategory');
        const c1 = new Category('C1Category', superC);
        const c2 = new Category('C2Category', superC);
        const c3 = new Category('C3Category', superC);
        const subC1 = new Category('SubC1Category', c1);

        return db.put(ctx, superC, c1, c2, c3, subC1)
          .then(()=>db.readCategoryIndex(c1, 'subCategories')
          .then(list=>assert.deepEqual(list, [subC1.hashCode]))
          .then(()=>db.readCategoryIndex(superC, 'subCategories'))
          .then(list=>assert.deepEqual(list.sort(), [c1.hashCode, c2.hashCode, c3.hashCode, subC1.hashCode].sort()))
        );
    }));
  });


  it('does a batch loadDir()', function() {
    return Database.create(path+'/db9', new DatabaseConfig(Dictionary.fromObject({sizing: 99}).elements))
    .then(db=>DbSession.create(db).then(session=> {
      const ctx = session.ctx;
      return Loader.loadDir(ctx, 'test/database/data/loadTest')
      .then(n=>{
        assert.equal(5, n);
        return db.get(ctx, 'AThing2');
      })
      .then(at2=>{assert.equal("MySubSubCategory", at2.category.distinctName); return at2.category.get(ctx);})
      .then(cat=>assert.equal("MySubSubCategory", cat.distinctName) || cat)
      .then(cat=>assert.equal(null, cat.superCategory));
    }));
  });
});