'use strict';

require('source-map-support').install();
const DefaultContext = require('../../build/jel/DefaultContext.js').default;
const JelBoolean = require('../../build/jel/types/JelBoolean.js').default;
const EnumValue = require('../../build/jel/types/EnumValue.js').default;
const DbRef = require('../../build/database/DbRef.js').default;
const Database = require('../../build/database/Database.js').default;
const DbSession = require('../../build/database/DbSession.js').default;
const {JelAssert, JelPromise, JelConsole} = require('../jel-assert.js');

const tmp = require('tmp');

tmp.dir(function(err, path) {
	if (err) 
		throw err;
	console.log(`enum-test.js: Using tmp dir ${path}`);
	
	const db = Database.create(path+'/dbenum1');
	const ds = new DbSession(db);
	const jelAssert = new JelAssert(ds.ctx.plus({DbRef}));

	describe('EnumValue', function() {
		it('creates and serializes', function() {
			jelAssert.equal(new EnumValue("T1", new DbRef('T')), 'EnumValue("T1", @T)');
		});

		it('supports EnumValue<->EnumValue comparisons', function() {
			jelAssert.equal(JelBoolean.TRUE, "EnumValue('Foo', @Bar) == EnumValue('Foo', @Bar)");
			jelAssert.equal(JelBoolean.FALSE, "EnumValue('Foo', @Bar) != EnumValue('Foo', @Bar)");
			jelAssert.equal(JelBoolean.FALSE, "EnumValue('Foo', @Bar) == EnumValue('Nope', @Bar)");
			jelAssert.equal(JelBoolean.FALSE, "EnumValue('Foo', @Bar) == EnumValue('Foo', @Nope)");
			jelAssert.equal(JelBoolean.TRUE, "EnumValue('Foo', @Bar) != EnumValue('Nope', @Bar)");
			jelAssert.equal(JelBoolean.TRUE, "EnumValue('Foo', @Bar) != EnumValue('Foo', @Nope)");
		});

		it('supports EnumValue<->string comparisons', function() {
			jelAssert.equal(JelBoolean.TRUE, "EnumValue('Foo', @Bar) == 'Foo'");
			jelAssert.equal(JelBoolean.FALSE, "EnumValue('Foo', @Bar) != 'Foo'");
			jelAssert.equal(JelBoolean.FALSE, "EnumValue('Foo', @Bar) == 'Nope'");
			jelAssert.equal(JelBoolean.TRUE, "EnumValue('Foo', @Bar) != 'Nope'");
		});
	});
});

