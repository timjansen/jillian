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
    return jelAssert.equalPromise("@Monday.getBestValue('uNkNoWnFaCt', Timestamp(5000))", 'null');
  });

  it('values can be read from the thing', function() {
    return jelAssert.equalPromise("@Monday.getBestValue('dayOfWeekNumber', Timestamp(5000)).value", '1');
  });

  it('values can be read as members', function() {
    return jelAssert.equalPromise("@Monday.dayOfWeekNumber", '1');
  });

  it('value lists can be read from the thing', function() {
    return jelAssert.equalPromise("let a = @Wednesday.getBestValues('dayOfWeekNumber', Timestamp(5000)): [a.size, a[0].value]", '[1,3]');
  });

  it('values can be inherited from the category', function() {
    return jelAssert.equalPromise("@Monday.getBestValue('duration', Timestamp(5000)).value", '1 @Day');
  });

  it('values can be functions', function() {
    return jelAssert.equalPromise("[@Monday.isMatch(LocalDate(2019, 3, 20)), @Wednesday.isMatch(LocalDate(2019, 3, 20))]", '[false, true]');
  });

  it('values can be provided by mixins', function() {
    return jelAssert.equalPromise("@StPatricksDay.duration", '1 @Day');
  });

});



