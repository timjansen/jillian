'use strict';

// Note that this test is in the database dir because UnitValue requires DB objects
//

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
const {JelAssert, JelPromise, JelConsole} = require('../jel-assert.js');
const jelAssert = new JelAssert();


const path = 'build/tmp/bootstrap-load';
const db = new Database(path);
const session = new DbSession(db, DefaultContext.plus({JelPromise, JelConsole}));

jelAssert.setCtx(session.ctx);

describe('Loader', function() {
  it('loads DB objects', function() {
    return Promise.resolve(session.get('Meter'))
    .then(m=>Promise.resolve(m.member(session.ctx, 'isPrimaryUnit')))
    .then(m=>assert.ok(m));
  });

});
