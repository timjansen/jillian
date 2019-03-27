'use strict';

require('source-map-support').install();
const Database = require('../../build/database/Database.js').default;
const Loader = require('../../build/database/Loader.js').default;
const DbSession = require('../../build/database/DbSession.js').default;
const DbRef = require('../../build/database/DbRef.js').default;
const JEL = require('../../build/jel/JEL.js').default;
const DefaultContext = require('../../build/jel/DefaultContext.js').default;
const Context = require('../../build/jel/Context.js').default;
const List = require('../../build/jel/types/List.js').default;
const Util = require('../../build/util/Util.js').default;
const assert = require('assert');
const {plus, JelAssert, JelPromise, JelConsole} = require('../jel-assert.js');
const jelAssert = new JelAssert();


const path = 'build/tmp/db-init';

describe('Facts', function() {
  let db, session, ctx;
  before(function() {
      db = new Database(path);
      return DbSession.create(db).then(s=>{
        session = s;
        return plus(s.ctx).then(c=> {
          ctx = c;
          jelAssert.setCtx(ctx);
        });
      });
  });  
  
  it('unknown facts can not be found', function() {
    return jelAssert.equalPromise("@Monday.getBestFactResult('uNkNoWnFaCt', Timestamp(5000))", 'null');
  });

  it('values can be read from the thing', function() {
    return jelAssert.equalPromise("@Monday.getBestFactResult('dayOfWeekNumber', Timestamp(5000)).value", '1');
  });

  it('values can be read as members', function() {
    return jelAssert.equalPromise("@Monday.dayOfWeekNumber", '1');
  });

  it('value lists can be read from the thing', function() {
    return jelAssert.equalPromise("let a = @Wednesday.getBestFactResults('dayOfWeekNumber', Timestamp(5000)): [a.size, a[0].value]", '[1,3]');
  });

  it('values can be inherited from the category', function() {
    return jelAssert.equalPromise("@Monday.getBestFactResult('duration', Timestamp(5000)).value", '1 @Day');
  });

  it('values can be functions', function() {
    return jelAssert.equalPromise("[@Monday.isMatch(LocalDate(2019, 3, 20)), @Wednesday.isMatch(LocalDate(2019, 3, 20))]", '[false, true]');
  });

  it('values can be provided by mixins', function() {
    return jelAssert.equalPromise("@StPatricksDay.duration", '1 @Day');
  });

  it('@TestFactA and @TestCategory are set up correctly', function() {
    return Promise.all([jelAssert.equalPromise("@TestFactA.a", '1'), 
                       jelAssert.equalPromise("@TestFactA.b", '8'), 
                       jelAssert.equalPromise("@TestFactA.ma", '15'), 
                       jelAssert.equalPromise("@TestFactA.mb", '2'),
                       jelAssert.equalPromise("@TestCategory.a", '1')]);
  });
  
  it('Things have methods to retrieve facts', function() {
    return Promise.all([jelAssert.equalPromise("@TestFactA.getAllFacts('sum').length", '1'),
      jelAssert.equalPromise("@TestFactA.getFilteredFacts('sum', (f,i)=>true, 5).length*2", '2'),
      jelAssert.equalPromise("@TestFactA.getBestFacts('sum', Timestamp(0)).length*4", '4')]);
  });

  
  it('values can not be calculated when fields are missing', function() {
    return jelAssert.errorPromise("@TestCategory.sum", 'Can not find member');
  });

  it('values can be calculated', function() {
    return jelAssert.equalPromise("@TestFactA.sum", '26');
  });

  it('can exclude values', function() {
    return Promise.all([jelAssert.equalPromise("@TestFactA.getBestFacts('sum', Timestamp.EPOCH, excludedProperties=Set.of('b'))", "[]"),
                        jelAssert.equalPromise("@TestFactA.getBestFacts('sum', Timestamp.EPOCH, excludedProperties=Set.of('x')).length", "1")]);
  });
  
  it('can use meta values', function() {
    return Promise.all([jelAssert.equalPromise("@TestFactA.getBestFactResults('sum', Timestamp.EPOCH, metaProperties={x: 10}).map(r=>r.value)", "[26]"),
                        jelAssert.equalPromise("@TestFactA.getBestFactResults('sum', Timestamp.EPOCH, metaProperties={a: 2}).map(r=>r.value)", "[27]"),
                        jelAssert.equalPromise("@TestFactA.getBestFactResults('sum', Timestamp.EPOCH, metaProperties={a: 0, b: 12, ma: 35, mb: 13}).map(r=>r.value)", "[60]")]);
  });

  
  // TODO:
  // multi-fact evaluation
  // check timestamp in facts
  // test assertionfact
  // test rangefact
  // test calcrangefact
  // test listfact
  // test distfact
  // test negative facts
});



