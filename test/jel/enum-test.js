'use strict';

require('source-map-support').install();
const Context = require('../../build/jel/Context.js').default;
const FuzzyBoolean = require('../../build/jel/types/FuzzyBoolean.js').default;
const EnumValue = require('../../build/jel/types/EnumValue.js').default;
const {JelAssert, JelPromise, JelConsole} = require('../jel-assert.js');
const jelAssert = new JelAssert(new Context().setAll({EnumValue, FuzzyBoolean}));


describe('EnumValue', function() {
	it('creates and serializes', function() {
		jelAssert.equal(new EnumValue("T1", "T"), 'EnumValue("T1", "T")');
	});

	it('supports EnumValue<->EnumValue comparisons', function() {
		jelAssert.equal(FuzzyBoolean.TRUE, "EnumValue('Foo', 'Bar') == EnumValue('Foo', 'Bar')");
		jelAssert.equal(FuzzyBoolean.FALSE, "EnumValue('Foo', 'Bar') != EnumValue('Foo', 'Bar')");
		jelAssert.equal(FuzzyBoolean.FALSE, "EnumValue('Foo', 'Bar') == EnumValue('Nope', 'Bar')");
		jelAssert.equal(FuzzyBoolean.FALSE, "EnumValue('Foo', 'Bar') == EnumValue('Foo', 'Nope')");
		jelAssert.equal(FuzzyBoolean.TRUE, "EnumValue('Foo', 'Bar') != EnumValue('Nope', 'Bar')");
		jelAssert.equal(FuzzyBoolean.TRUE, "EnumValue('Foo', 'Bar') != EnumValue('Foo', 'Nope')");
	});

	it('supports EnumValue<->string comparisons', function() {
		jelAssert.equal(FuzzyBoolean.TRUE, "EnumValue('Foo', 'Bar') == 'Foo'");
		jelAssert.equal(FuzzyBoolean.FALSE, "EnumValue('Foo', 'Bar') != 'Foo'");
		jelAssert.equal(FuzzyBoolean.FALSE, "EnumValue('Foo', 'Bar') == 'Nope'");
		jelAssert.equal(FuzzyBoolean.TRUE, "EnumValue('Foo', 'Bar') != 'Nope'");
	});
});

