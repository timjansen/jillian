'use strict';

// Note that this test is in the database dir because UnitValue requires DB objects
//

require('source-map-support').install();
const Database = require('../../build/database/Database.js').default;
const Loader = require('../../build/database/Loader.js').default;
const DbSession = require('../../build/database/DbSession.js').default;
var fs = require('fs');

const path = 'build/tmp/db-init';


console.log(`load.js started`);
const start = new Date().getTime();

Database.create(path)
  .then(db=>Loader.bootstrapDatabaseObjects(db, 'database-load/objects', console.log))
  .catch(e=>{
    const msg = e.exception ? e.exception.member(ctx, 'message') : e;
    console.log('Aborted load with error: ', msg); 
    process.exit(1);
  })
  .then(n=>console.log(`load.js done, ${new Date().getTime() - start} ms for ${n} objects (${Math.round((new Date().getTime() - start)/(n||1))} ms/object).`))

