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
const Dictionary = require('../../build/jel/types/Dictionary.js').default;
const Unit = require('../../build/jel/types/Unit.js').default;
const UnitValue = require('../../build/jel/types/UnitValue.js').default;
const ApproximateNumber = require('../../build/jel/types/ApproximateNumber.js').default;
const Fraction = require('../../build/jel/types/Fraction.js').default;
const Util = require('../../build/util/Util.js').default;
const assert = require('assert');
const {plus, JelAssert, JelPromise, JelConsole} = require('../jel-assert.js');
const jelAssert = new JelAssert();


const path = 'build/tmp/db-init';

describe('Loader', function() {
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
  
  
  it('loads DB objects', function() {
    return Promise.resolve(session.get('Meter'))
    .then(m=>Promise.resolve(m.member(session.ctx, 'isPrimaryUnit')))
    .then(m=>assert.ok(m));
  });

  it('loads holidays', function() {
    return Promise.all([jelAssert.equalPromise('@Easter.matchesInYear(2005)', '[LocalDate(2005, 3, 27)]'),
                        jelAssert.equalPromise('@MartinLutherKingJrDay.matchesInYear(2005)', '[LocalDate(2005, 1, 17)]'), 
                        jelAssert.equalPromise('@StPatricksDay.matchesInYear(2015)', '[LocalDate(2015, 3, 17)]')]);
  });

  it('loads months', function() {
    return jelAssert.equalPromise('@December.order.successor', '@January');
  });

  it('loads weekdays', function() {
    return jelAssert.equalPromise('@Sunday.order.successor', '@Monday');
  });


  it('loads Geo classes', function() {
    return jelAssert.equalPromise('import Geo::Coordinate do Coordinate(1, 2).longitude', '2');
  });

  it('loads the Geo package', function() {
    return jelAssert.equalPromise('import Geo::* do Coordinate(1, 2).longitude', '2');
  });
  
});
