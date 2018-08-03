'use strict';

require('source-map-support').install();
const Context = require('../../build/jel/Context.js').default;
const List = require('../../build/jel/types/List.js').default;
const Distribution = require('../../build/jel/types/Distribution.js').default;
const DistributionPoint = require('../../build/jel/types/DistributionPoint.js').default;
const ApproximateNumber = require('../../build/jel/types/ApproximateNumber.js').default;
const Fraction = require('../../build/jel/types/Fraction.js').default;
const UnitValue = require('../../build/jel/types/UnitValue.js').default;
const FuzzyBoolean = require('../../build/jel/types/FuzzyBoolean.js').default;
const {JelAssert, JelPromise, JelConsole} = require('../jel-assert.js');
const jelAssert = new JelAssert(new Context().setAll({Distribution, DistributionPoint, ApproximateNumber, Fraction, UnitValue}));

describe('Distribution', function() {
	it('creates and serializes', function() {
		jelAssert.equal("Distribution(min=5, max=10)", new Distribution(new List([new DistributionPoint(5, 0), new DistributionPoint(10, 1)])));
	});
});
