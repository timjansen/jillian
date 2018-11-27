'use strict';

require('source-map-support').install();
const Database = require('../../build/database/Database.js').default;
const DbSession = require('../../build/database/DbSession.js').default;
const DatabaseContext = require('../../build/database/DatabaseContext.js').default;
const DbRef = require('../../build/database/DbRef.js').default;
const SimplePropertyType = require('../../build/jel/types/properties/SimplePropertyType.js').default;
const ComplexPropertyType = require('../../build/jel/types/properties/ComplexPropertyType.js').default;
const DictionaryPropertyType = require('../../build/jel/types/properties/DictionaryPropertyType.js').default;
const FunctionPropertyType = require('../../build/jel/types/properties/FunctionPropertyType.js').default;
const ListPropertyType = require('../../build/jel/types/properties/ListPropertyType.js').default;
const OptionPropertyType = require('../../build/jel/types/properties/OptionPropertyType.js').default;
const CategoryPropertyType = require('../../build/database/dbProperties/CategoryPropertyType.js').default;
const JEL = require('../../build/jel/JEL.js').default;
const Context = require('../../build/jel/Context.js').default;
const JelNumber = require('../../build/jel/types/JelNumber.js').default;
const JelString = require('../../build/jel/types/JelString.js').default;
const Dictionary = require('../../build/jel/types/Dictionary.js').default;
const List = require('../../build/jel/types/List.js').default;
const tmp = require('tmp');
const assert = require('assert');
const {JelAssert, JelPromise, JelConsole} = require('../jel-assert.js');
const jelAssert = new JelAssert();

tmp.dir(function(err, path) {
  if (err) 
		throw err;
	Database.create(path+'/proptest')
	.then(db=>{
		const session = new DbSession(db);
		const ctx = session.ctx;
    jelAssert.setCtx(ctx);
		
		describe('PropertyTypes', function() {
      it('can be created and serialized', function() {
        jelAssert.equal('SimplePropertyType(@Number, {a: 2}, {x: @Number})', new SimplePropertyType(new DbRef('Number'), Dictionary.fromObject({a: JelNumber.valueOf(2)}), Dictionary.fromObject({x: new DbRef('Number')})));
        jelAssert.equal('ComplexPropertyType({b: @Number})', new ComplexPropertyType(Dictionary.fromObject({b: new DbRef('Number')})));
        jelAssert.equal('CategoryPropertyType(@Number, true)', new CategoryPropertyType(new DbRef('Number'), true));
        jelAssert.equal('FunctionPropertyType(["c", "v"])', new FunctionPropertyType(new List([JelString.valueOf("c"), JelString.valueOf("v")])));
        jelAssert.equal('ListPropertyType(@Number)', new ListPropertyType(new DbRef('Number')));
        jelAssert.equal('OptionPropertyType([@Number, null])', new OptionPropertyType(new List([new DbRef('Number'), null])));
      })

      it('checks types', function() {
        jelAssert.fuzzy('SimplePropertyType(@Number).checkProperty(2)', 1);
        jelAssert.fuzzy('SimplePropertyType(@Number).checkProperty(null)', 0);
        jelAssert.fuzzy('SimplePropertyType(@Number).checkProperty("x")', 0);
        
        jelAssert.fuzzy('ComplexPropertyType({b: @Number}).checkProperty({b: 2})', 1);
        jelAssert.fuzzy('ComplexPropertyType({b: @Number}).checkProperty({b: 2, x: 1})', 1);
        jelAssert.fuzzy('ComplexPropertyType({b: @Number}).checkProperty({b: "d"})', 0);
        jelAssert.fuzzy('ComplexPropertyType({b: @Number}).checkProperty({a: 2})', 0);
        jelAssert.fuzzy('ComplexPropertyType({b: @Number}).checkProperty(2)', 0);
        
        jelAssert.fuzzy('FunctionPropertyType(["c", "v"]).checkProperty((c,v)=>c+v)', 1);
        jelAssert.fuzzy('FunctionPropertyType(["c", "v"]).checkProperty((c,o)=>c+v)', 1);
        jelAssert.fuzzy('FunctionPropertyType(["c", "v"]).checkProperty((c)=>c+v)', 1);
        jelAssert.fuzzy('FunctionPropertyType(["c", "v"]).checkProperty("eek")', 0);
        
        jelAssert.fuzzy('ListPropertyType(@Number).checkProperty([1,2,3])', 1);
        jelAssert.fuzzy('ListPropertyType(@Number).checkProperty([])', 1);
        jelAssert.fuzzy('ListPropertyType(@Number).checkProperty([1, "a"])', 0);
        jelAssert.fuzzy('ListPropertyType(@Number).checkProperty("a")', 0);

        jelAssert.fuzzy('OptionPropertyType([@Number, null]).checkProperty(1)', 1);
        jelAssert.fuzzy('OptionPropertyType([@Number, null]).checkProperty(null)', 1);
        jelAssert.fuzzy('OptionPropertyType([@Number, null]).checkProperty("a")', 0);
      })

    });

	});
});