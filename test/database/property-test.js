'use strict';

require('source-map-support').install();
const Database = require('../../build/database/Database.js').default;
const DbSession = require('../../build/database/DbSession.js').default;
const DatabaseContext = require('../../build/database/DatabaseContext.js').default;
const DbRef = require('../../build/database/DbRef.js').default;
const SimpleType = require('../../build/jel/types/typeDescriptors/SimpleType.js').default;
const ComplexType = require('../../build/jel/types/typeDescriptors/ComplexType.js').default;
const DictionaryType = require('../../build/jel/types/typeDescriptors/DictionaryType.js').default;
const FunctionType = require('../../build/jel/types/typeDescriptors/FunctionType.js').default;
const ListType = require('../../build/jel/types/typeDescriptors/ListType.js').default;
const OptionType = require('../../build/jel/types/typeDescriptors/OptionType.js').default;
const OptionalType = require('../../build/jel/types/typeDescriptors/OptionalType.js').default;
const CategoryType = require('../../build/database/dbProperties/CategoryType.js').default;
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
		
		describe('Types', function() {
      it('can be created and serialized', function() {
        jelAssert.equal('SimpleType(@Number, {a: 2}, {x: @Number})', new SimpleType('Number', Dictionary.fromObject({a: JelNumber.valueOf(2)}), Dictionary.fromObject({x: new DbRef('Number')})));
        jelAssert.equal('ComplexType({b: @Number})', new ComplexType(Dictionary.fromObject({b: new DbRef('Number')})));
        jelAssert.equal('CategoryType(@Number, true)', new CategoryType(new DbRef('Number'), true));
        jelAssert.equal('FunctionType(["c", "v"])', new FunctionType(new List([JelString.valueOf("c"), JelString.valueOf("v")])));
        jelAssert.equal('ListType(@Number)', new ListType(new DbRef('Number')));
        jelAssert.equal('OptionType([@Number, null])', new OptionType(new List([new DbRef('Number'), null])));
        jelAssert.equal('OptionalType(@Number)', new OptionalType(new DbRef('Number')));
      })

      it('checks types', function() {
        jelAssert.fuzzy('AnyType().checkType(1)', 1);
        jelAssert.fuzzy('AnyType().checkType(null)', 1);
        jelAssert.fuzzy('AnyType().checkType("a")', 1);

        jelAssert.fuzzy('any.checkType(1)', 1);
        jelAssert.fuzzy('any.checkType(null)', 1);
        jelAssert.fuzzy('any.checkType("a")', 1);

        jelAssert.fuzzy('SimpleType(@Number).checkType(2)', 1);
        jelAssert.fuzzy('SimpleType(@Number).checkType(null)', 0);
        jelAssert.fuzzy('SimpleType(@Number).checkType("x")', 0);

        jelAssert.fuzzy('SimpleType(Number).checkType(2)', 1);
        jelAssert.fuzzy('SimpleType(Number).checkType(null)', 0);
        jelAssert.fuzzy('SimpleType(Number).checkType("x")', 0);
        
        jelAssert.fuzzy('SimpleType("Number").checkType(2)', 1);
        jelAssert.fuzzy('SimpleType("Number").checkType(null)', 0);
        jelAssert.fuzzy('SimpleType("Number").checkType("x")', 0);
        
        jelAssert.fuzzy('ComplexType({b: @Number}).checkType({b: 2})', 1);
        jelAssert.fuzzy('ComplexType({b: @Number}).checkType({b: 2, x: 1})', 1);
        jelAssert.fuzzy('ComplexType({b: @Number}).checkType({b: "d"})', 0);
        jelAssert.fuzzy('ComplexType({b: @Number}).checkType({a: 2})', 0);
        jelAssert.fuzzy('ComplexType({b: @Number}).checkType(2)', 0);
        
        jelAssert.fuzzy('FunctionType(["c", "v"]).checkType((c,v)=>c+v)', 1);
        jelAssert.fuzzy('FunctionType(["c", "v"]).checkType((c,o)=>c+v)', 1);
        jelAssert.fuzzy('FunctionType(["c", "v"]).checkType((c)=>c+v)', 1);
        jelAssert.fuzzy('FunctionType(["c", "v"]).checkType("eek")', 0);
        
        jelAssert.fuzzy('ListType(@Number).checkType([1,2,3])', 1);
        jelAssert.fuzzy('ListType(@Number).checkType([])', 1);
        jelAssert.fuzzy('ListType(@Number).checkType([1, "a"])', 0);
        jelAssert.fuzzy('ListType(@Number).checkType("a")', 0);

        jelAssert.fuzzy('OptionType([@Number, @String, null]).checkType(1)', 1);
        jelAssert.fuzzy('OptionType([@Number, @String, null]).checkType("foo")', 1);
        jelAssert.fuzzy('OptionType([@Number, null]).checkType(null)', 1);
        jelAssert.fuzzy('OptionType([@Number, null]).checkType("a")', 0);
        jelAssert.fuzzy('OptionType([@Number, @String]).checkType(null)', 0);

        jelAssert.fuzzy('OptionalType(@Number).checkType(1)', 1);
        jelAssert.fuzzy('OptionalType(@Number).checkType(null)', 1);
        jelAssert.fuzzy('OptionalType(@Number).checkType("a")', 0);

        jelAssert.fuzzy('@Number?.checkType(1)', 1);
        jelAssert.fuzzy('@Number?.checkType(null)', 1);
        jelAssert.fuzzy('@Number?.checkType("a")', 0);
      });

    });

	});
});