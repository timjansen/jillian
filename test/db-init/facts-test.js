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

  it('can use multiple facts', function() {
    return Promise.all([
      jelAssert.equalPromise("@TestFactB.getAllFacts('b').length", "5"),
      jelAssert.equalPromise("@TestFactB.getFilteredFacts('b', (f, i)=>i != 2).length", "4"),
      jelAssert.equalPromise("@TestFactB.getFilteredFacts('b', (f, i)=>f instanceof ValueFact).length", "3"),
      jelAssert.equalPromise("@TestFactB.getBestFacts('b', Timestamp(500)).length", "4"),
      jelAssert.equalPromise("@TestFactB.getBestFacts('b', Timestamp(500), max=2).length", "2"),
      jelAssert.equalPromise("@TestFactB.getBestFactResults('b', Timestamp(500)).map(v=>v.value)", "[100, 999]"),
      jelAssert.equalPromise("@TestFactB.getBestFactResults('b', Timestamp(500), max=1).map(v=>v.value)", "[100]"),
      jelAssert.equalPromise("@TestFactB.getBestFactResult('b', Timestamp(500)).value", "100"),
      jelAssert.equalPromise("@TestFactB.getBestDiscreteValue('b', Timestamp(500)).value", "100"),
      
      jelAssert.equalPromise("@TestFactB.getBestFacts('c', Timestamp(500)).length", "3"),
      jelAssert.equalPromise("@TestFactB.getBestFactResults('c', Timestamp(500)).map(v=>v.value)", "[500...600, 100, 999]"),
      jelAssert.equalPromise("@TestFactB.getBestFactResult('c', Timestamp(500)).value", "500...600"),
      jelAssert.equalPromise("@TestFactB.getBestDiscreteValue('c', Timestamp(500)).value", "100")
    ]);   
  });
  
  it('uses timestamps for fact evaluation', function() {
    return Promise.all([
      jelAssert.equalPromise("@TestFactB.getBestFacts('b', Timestamp(1)).length", "3"),
      jelAssert.equalPromise("@TestFactB.getBestFacts('b', Timestamp(750)).length", "2"),
      jelAssert.equalPromise("@TestFactB.getBestFactResults('b', Timestamp(750)).map(v=>v.value)", "[]"),
      jelAssert.equalPromise("@TestFactB.getBestFactResults('b', Timestamp(650)).map(v=>v.value)", "[100]"),
      jelAssert.equalPromise("@TestFactB.getBestFactResult('b', Timestamp(650)).value", "100"),
      jelAssert.equalPromise("@TestFactB.getBestDiscreteValue('b', Timestamp(750))", "null"),
      
      jelAssert.equalPromise("@TestFactB.getBestFacts('c', Timestamp(600)).length", "2"),
      jelAssert.equalPromise("@TestFactB.getBestFacts('c', Timestamp(10)).length", "1"),
      jelAssert.equalPromise("@TestFactB.getBestFacts('c', Timestamp(80)).length", "2"),
      jelAssert.equalPromise("@TestFactB.getBestFactResults('c', Timestamp(50)).map(v=>v.value)", "[500...600, 100]"),
      jelAssert.equalPromise("@TestFactB.getBestFactResult('c', Timestamp(50)).value", "500...600"),
      jelAssert.equalPromise("@TestFactB.getBestDiscreteValue('c', Timestamp(50)).value", "100")
    ]);   
  });
  
  it('supports preconditions', function() {
    return Promise.all([
      jelAssert.equalPromise("@TestFactC.getAllFacts('c').length", "2"),
      jelAssert.equalPromise("@TestFactC.getBestFacts('c', Timestamp.EPOCH).length", "1"),
      jelAssert.equalPromise("@TestFactC.getBestFactResults('c', Timestamp.EPOCH).map(v=>v.value)", "[200]"),
      jelAssert.equalPromise("@TestFactC.getBestFactResult('c', Timestamp.EPOCH).value", "200"),
      jelAssert.equalPromise("@TestFactC.getBestDiscreteValue('c', Timestamp.EPOCH).value", "200"),

      jelAssert.equalPromise("@TestFactC.getAllFacts('b').length", "4"),
      jelAssert.equalPromise("@TestFactC.getFilteredFacts('b', (f, i)=>i != 1).length", "3"),
      jelAssert.equalPromise("@TestFactC.getFilteredFacts('b', (f, i)=>f instanceof ValueFact).length", "4"),
      jelAssert.equalPromise("@TestFactC.getBestFacts('b', Timestamp.EPOCH).length", "2"),
      jelAssert.equalPromise("@TestFactC.getBestFacts('b', Timestamp.EPOCH, max=1).length", "1"),
      jelAssert.equalPromise("@TestFactC.getBestFactResults('b', Timestamp.EPOCH).map(v=>v.value)", "[400, 100]"),
      jelAssert.equalPromise("@TestFactC.getBestFactResults('b', Timestamp.EPOCH, max=1).map(v=>v.value)", "[400]"),
      jelAssert.equalPromise("@TestFactC.getBestFactResult('b', Timestamp.EPOCH).value", "400"),
      jelAssert.equalPromise("@TestFactC.getBestDiscreteValue('b', Timestamp.EPOCH).value", "400"),
    ]);   
  });
  
  // TODO:
  // a dependency to itself, either in FunctionFact or in precondition
  // test calculatedfact: also test calcfacts depending on each other!! Anc circular deps.
  // test assertionfact
  // test rangefact
  // test calcrangefact
  // test listfact
  // test distfact
  // test negative facts
  // test non-comprehensive facts
});



