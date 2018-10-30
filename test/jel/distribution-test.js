'use strict';

require('source-map-support').install();
const DefaultContext = require('../../build/jel/DefaultContext.js').default;
const List = require('../../build/jel/types/List.js').default;
const Distribution = require('../../build/jel/types/Distribution.js').default;
const DistributionPoint = require('../../build/jel/types/DistributionPoint.js').default;
const ApproximateNumber = require('../../build/jel/types/ApproximateNumber.js').default;
const Fraction = require('../../build/jel/types/Fraction.js').default;
const UnitValue = require('../../build/jel/types/UnitValue.js').default;
const JelBoolean = require('../../build/jel/types/JelBoolean.js').default;
const {JelAssert, JelPromise, JelConsole} = require('../jel-assert.js');
const jelAssert = new JelAssert(DefaultContext.get());

describe('Distribution', function() {
	it('creates and serializes', function() {
		jelAssert.equal("Distribution(min=5, max=10)", new Distribution(new List([new DistributionPoint(5, 0), new DistributionPoint(10, 1)])));
		jelAssert.equal("Distribution(mean=10)", new Distribution(new List([new DistributionPoint(10, 0.5)])));
		jelAssert.equal("Distribution(min=5, mean=8, max=10)", new Distribution(new List([new DistributionPoint(5, 0), new DistributionPoint(8, 0.5), new DistributionPoint(10, 1)])));
		jelAssert.equal("Distribution([DistributionPoint(5, 0), DistributionPoint(8, 0.5), DistributionPoint(10, 1)])", new Distribution(new List([new DistributionPoint(5, 0), new DistributionPoint(8, 0.5), new DistributionPoint(10, 1)])));
		jelAssert.equal("Distribution([DistributionPoint(6, 0.1), DistributionPoint(8, 0.5), DistributionPoint(9, 0.9)],min=5, max=10)", 
										new Distribution(new List([new DistributionPoint(5, 0), new DistributionPoint(6, 0.1), new DistributionPoint(8, 0.5), new DistributionPoint(9, 0.9), new DistributionPoint(10, 1)])));
	});

	it('has min()/mean()/max()', function() {
		jelAssert.equal("Distribution(min=5, max=10).min()", 5);
		jelAssert.equal("Distribution(min=5, max=10).max()", 10);
		jelAssert.equal("Distribution(mean=10).mean()", 10);
		jelAssert.equal("Distribution(min=5, max=10).mean()", 7.5);
		jelAssert.equal("Distribution(mean=7.5, max=10).min()", 5);
		jelAssert.equal("Distribution(mean=10, max=5).min()", 15);
		jelAssert.equal("Distribution(min=0, max=5).mean()", 2.5);
		jelAssert.equal("Distribution([DistributionPoint(1, 0), DistributionPoint(10, 0.4), DistributionPoint(11, 0.6), DistributionPoint(13, 1)]).mean()", 10.5);
	});

	it('has getValue()', function() {
		jelAssert.equal("Distribution([DistributionPoint(1, 0.8)]).getValue(0.2)", 1);
		jelAssert.equal("Distribution([DistributionPoint(5, 0.5), DistributionPoint(10, 1)]).getValue(0.25)", 2.5);
		jelAssert.equal("Distribution([DistributionPoint(1, 0), DistributionPoint(10, 0.4), DistributionPoint(11, 0.6), DistributionPoint(13, 1)]).getValue(0)", 1);
		jelAssert.equal("Distribution([DistributionPoint(1, 0), DistributionPoint(10, 0.4), DistributionPoint(11, 0.6), DistributionPoint(13, 1)]).getValue(-5)", 1);
		jelAssert.equal("Distribution([DistributionPoint(1, 0), DistributionPoint(10, 0.4), DistributionPoint(11, 0.6), DistributionPoint(13, 1)]).getValue(0.5)", 10.5);
		jelAssert.equal("Distribution([DistributionPoint(1, 0), DistributionPoint(10, 0.4), DistributionPoint(11, 0.6), DistributionPoint(13, 1)]).getValue(0.6)", 11);
		jelAssert.equal("Distribution([DistributionPoint(1, 0), DistributionPoint(10, 0.4), DistributionPoint(11, 0.6), DistributionPoint(13, 1)]).getValue(1)", 13);
		jelAssert.equal("Distribution([DistributionPoint(1, 0), DistributionPoint(10, 0.4), DistributionPoint(11, 0.6), DistributionPoint(13, 1)]).getValue(5)", 13);
		jelAssert.equal("Distribution([DistributionPoint(0, 0), DistributionPoint(10, 0.4), DistributionPoint(11, 0.6), DistributionPoint(13, 1)]).getValue(0.3)", 10*(3/4));
		jelAssert.equal("Distribution([DistributionPoint(0, 0), DistributionPoint(10, 0.4), DistributionPoint(11, 0.6), DistributionPoint(13, 1)]).getValue(0.7)", 11.5);
		jelAssert.equal("Distribution([DistributionPoint(0, 0), DistributionPoint(10, 0.4), DistributionPoint(11, 0.6), DistributionPoint(13, 1)]).getValue(0.8)", 12);
		jelAssert.equal("Distribution([DistributionPoint(0, 0), DistributionPoint(10, 0.4), DistributionPoint(11, 0.6), DistributionPoint(13, 1)]).getValue(0.9)", 12.5);
	});

	it('has getShare()', function() {
		jelAssert.equal("Distribution([DistributionPoint(1, 0.8)]).getShare(0.2)", null);
		jelAssert.equal("Distribution([DistributionPoint(1, 0.8)]).getShare(1)", 1);
		jelAssert.equal("Distribution([DistributionPoint(1, 0.8)], average=1.2).getShare(1.2)", 0.5);
		jelAssert.equal("Distribution([DistributionPoint(0, 0), DistributionPoint(10, 1)]).getShare(2.5)", 0.25);
		jelAssert.equal("Distribution([DistributionPoint(5, 0.5), DistributionPoint(10, 1)]).getShare(2.5)", 0.25);
		jelAssert.equal("Distribution([DistributionPoint(5, 0.5), DistributionPoint(10, 1)]).getShare(7.5)", 0.75);
		jelAssert.equal("Distribution([DistributionPoint(5, 0.5), DistributionPoint(10, 1)]).getShare(-3)", null);
		jelAssert.equal("Distribution([DistributionPoint(5, 0.5), DistributionPoint(10, 1)]).getShare(11)", null);
		jelAssert.equal("Distribution([DistributionPoint(1, 0), DistributionPoint(10, 0.4), DistributionPoint(11, 0.6), DistributionPoint(13, 1)]).getShare(1)", 0);
		jelAssert.equal("Distribution([DistributionPoint(1, 0), DistributionPoint(10, 0.4), DistributionPoint(11, 0.6), DistributionPoint(13, 1)]).getShare(10)", 0.4);
		jelAssert.equal("Distribution([DistributionPoint(1, 0), DistributionPoint(10, 0.4), DistributionPoint(11, 0.6), DistributionPoint(13, 1)]).getShare(13)", 1);
		jelAssert.equal("Distribution([DistributionPoint(1, 0), DistributionPoint(10, 0.4), DistributionPoint(11, 0.6), DistributionPoint(13, 1)]).getShare(10.5)", 0.5);
		jelAssert.equal("Distribution([DistributionPoint(0, 0), DistributionPoint(10, 0.4), DistributionPoint(11, 0.6), DistributionPoint(13, 1)]).getShare(7.5)", 0.3);
		jelAssert.equal("Distribution([DistributionPoint(0, 0), DistributionPoint(10, 0.4), DistributionPoint(11, 0.6), DistributionPoint(13, 1)]).getShare(11.5)", 0.7);
		jelAssert.equal("Distribution([DistributionPoint(0, 0), DistributionPoint(10, 0.4), DistributionPoint(11, 0.6), DistributionPoint(13, 1)]).getShare(12)", 0.8);
		jelAssert.equal("Distribution([DistributionPoint(0, 0), DistributionPoint(10, 0.4), DistributionPoint(11, 0.6), DistributionPoint(13, 1)]).getShare(12.5)", 0.9);
	});

		it('can add()', function() {
		jelAssert.equal("Distribution(min=5, max=10).add(mean=6)", new Distribution(new List([new DistributionPoint(5, 0), new DistributionPoint(6, 0.5), new DistributionPoint(10, 1)])));
		jelAssert.equal("Distribution(mean=6).add(min=5, max=10)", new Distribution(new List([new DistributionPoint(5, 0), new DistributionPoint(6, 0.5), new DistributionPoint(10, 1)])));
		jelAssert.equal("Distribution(min=5, max=10, mean=6, average=7).add(min=1, max=20, mean=11)", new Distribution(new List([new DistributionPoint(1, 0), new DistributionPoint(11, 0.5), new DistributionPoint(20, 1)]), 7));
		jelAssert.equal("Distribution(min=5, max=10, mean=6, average=7).add(average=5)", new Distribution(new List([new DistributionPoint(5, 0), new DistributionPoint(6, 0.5), new DistributionPoint(10, 1)]), 5));
		jelAssert.equal("Distribution([DistributionPoint(1, 0), DistributionPoint(10, 0.4), DistributionPoint(11, 0.6), DistributionPoint(13, 1)]).add([DistributionPoint(0, 0), DistributionPoint(10, 0.4), DistributionPoint(11.2, 0.7), DistributionPoint(13, 1)])", 
										new Distribution(new List([new DistributionPoint(0, 0), new DistributionPoint(10, 0.4), new DistributionPoint(11, 0.6), new DistributionPoint(11.2, 0.7), new DistributionPoint(13, 1)])));
	});

	
});
