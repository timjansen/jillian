'use strict';

require('source-map-support').install();
const Database = require('../../build/database/Database.js').default;
const DbSession = require('../../build/database/DbSession.js').default;
const DatabaseContext = require('../../build/database/DatabaseContext.js').default;
const DbRef = require('../../build/database/DbRef.js').default;
const AnyType = require('../../build/jel/types/typeDescriptors/AnyType.js').default;
const SimpleType = require('../../build/jel/types/typeDescriptors/SimpleType.js').default;
const ComplexType = require('../../build/jel/types/typeDescriptors/ComplexType.js').default;
const DictionaryType = require('../../build/jel/types/typeDescriptors/DictionaryType.js').default;
const FunctionType = require('../../build/jel/types/typeDescriptors/FunctionType.js').default;
const ListType = require('../../build/jel/types/typeDescriptors/ListType.js').default;
const OptionType = require('../../build/jel/types/typeDescriptors/OptionType.js').default;
const OptionalType = require('../../build/jel/types/typeDescriptors/OptionalType.js').default;
const CategoryType = require('../../build/database/dbTypes/CategoryType.js').default;
const JEL = require('../../build/jel/JEL.js').default;
const Context = require('../../build/jel/Context.js').default;
const Float = require('../../build/jel/types/Float.js').default;
const JelString = require('../../build/jel/types/JelString.js').default;
const Dictionary = require('../../build/jel/types/Dictionary.js').default;
const List = require('../../build/jel/types/List.js').default;
const assert = require('assert');
const {JelAssert, JelPromise, JelConsole} = require('../jel-assert.js');
const jelAssert = new JelAssert();

const path = 'build/tmp/typestestdb';
		
describe('Types', function() {
  
  let db, session, ctx;
  before(function() {
    return Database.create(path)
      .then(newdb=>{
        db = newdb;
        return DbSession.create(db).then(s=>{
          session = s;
          ctx = s.ctx;
          jelAssert.setCtx(ctx);
        })
      });
  });
  
  it('can be created and serialized', function() {
    jelAssert.equal('SimpleType(Float)', new SimpleType('Float'));
    jelAssert.equal('ComplexType({b: any})', new ComplexType(Dictionary.fromObject({b: AnyType.instance})));
    jelAssert.equal('CategoryType()', new CategoryType());
    jelAssert.equal('ListType(any)', new ListType(AnyType.instance));
    jelAssert.equal('OptionType([any, null])', new OptionType(new List([AnyType.instance, null])));
    jelAssert.equal('OptionalType(any)', new OptionalType(AnyType.instance));
  });

  it('checks non-db types', function() {
    jelAssert.fuzzy('any.checkType(1)', 1);
    jelAssert.fuzzy('any?.checkType(null)', 1);
    jelAssert.fuzzy('any.checkType(null)', 0);
    jelAssert.fuzzy('any.checkType("a")', 1);

    jelAssert.fuzzy('string.checkType(1)', 0);
    jelAssert.fuzzy('string.checkType(null)', 0);
    jelAssert.fuzzy('string.checkType("a")', 1);
    jelAssert.fuzzy('string.checkType("")', 0);

    jelAssert.fuzzy('int.checkType(1)', 1);
    jelAssert.fuzzy('int.checkType(1.1)', 0);
    jelAssert.fuzzy('int.checkType(null)', 0);
    jelAssert.fuzzy('int.checkType("a")', 0);
    jelAssert.fuzzy('int.checkType(15/5)', 1);
    jelAssert.fuzzy('int.checkType(15/4)', 0);

    jelAssert.fuzzy('int(2, 3).checkType(2)', 1);
    jelAssert.fuzzy('int(2, 3).checkType(3)', 1);
    jelAssert.fuzzy('int(2, 3).checkType(4)', 0);
    jelAssert.fuzzy('int(1...10).checkType(4)', 1);

    jelAssert.fuzzy('number.checkType(1)', 1);
    jelAssert.fuzzy('number.checkType(1.1)', 1);
    jelAssert.fuzzy('number.checkType(null)', 0);
    jelAssert.fuzzy('number.checkType("a")', 0);
    jelAssert.fuzzy('number.checkType(15/5)', 1);
    jelAssert.fuzzy('number.checkType(15/4)', 1);

    jelAssert.fuzzy('number(2, 3).checkType(2)', 1);
    jelAssert.fuzzy('number(2...3).checkType(2.5)', 1);
    jelAssert.fuzzy('number(2...3).checkType(3)', 1);
    jelAssert.fuzzy('number(2...3).checkType(4)', 0);
    jelAssert.fuzzy('number(1...10).checkType(4)', 1);

    jelAssert.fuzzy('InRangeType(2...3).checkType(2.5)', 1);
    jelAssert.fuzzy('InRangeType(2...3).checkType(3)', 1);
    jelAssert.fuzzy('InRangeType(2...3).checkType(4)', 0);
    jelAssert.fuzzy('InRangeType(1...10).checkType(4)', 1);

    jelAssert.fuzzy('bool.checkType(true)', 1);
    jelAssert.fuzzy('bool.checkType(1.1)', 0);
    jelAssert.fuzzy('bool.checkType(null)', 0);
    jelAssert.fuzzy('bool.checkType("a")', 0);
    jelAssert.fuzzy('bool.checkType(false)', 1);

    jelAssert.fuzzy('SimpleType(Float).checkType(2)', 1);
    jelAssert.fuzzy('SimpleType(Float).checkType(null)', 0);
    jelAssert.fuzzy('SimpleType(Float).checkType("x")', 0);

    jelAssert.fuzzy('SimpleType("Float").checkType(2)', 1);
    jelAssert.fuzzy('SimpleType("Float").checkType(null)', 0);
    jelAssert.fuzzy('SimpleType("Float").checkType("x")', 0);

    jelAssert.fuzzy('ComplexType({b: number}).checkType({b: 2})', 1);
    jelAssert.fuzzy('ComplexType({b: number}).checkType({b: 2, x: 1})', 1);
    jelAssert.fuzzy('ComplexType({b: number}).checkType({b: "d"})', 0);
    jelAssert.fuzzy('ComplexType({b: number}).checkType({a: 2})', 0);
    jelAssert.fuzzy('ComplexType({b: number}).checkType(2)', 0);

    jelAssert.fuzzy('ListType(number).checkType([1,2,3])', 1);
    jelAssert.fuzzy('ListType(number).checkType([])', 1);
    jelAssert.fuzzy('ListType(number).checkType([1, "a"])', 0);
    jelAssert.fuzzy('ListType(number).checkType("a")', 0);

    jelAssert.fuzzy('Float[].checkType([1,2,3])', 1);
    jelAssert.fuzzy('Float[].checkType([])', 1);
    jelAssert.fuzzy('Float[].checkType([1, "a"])', 0);
    jelAssert.fuzzy('Float[].checkType("a")', 0);

    jelAssert.fuzzy('DictionaryType(Float).checkType({a:2, b: 3})', 1);
    jelAssert.fuzzy('DictionaryType(Float).checkType({})', 1);
    jelAssert.fuzzy('DictionaryType(Float).checkType({a: 2, b: "a"})', 0);
    jelAssert.fuzzy('DictionaryType(Float).checkType("a")', 0);

    jelAssert.fuzzy('OptionType([Float, String, null]).checkType(1)', 1);
    jelAssert.fuzzy('OptionType([Float, String, null]).checkType("foo")', 1);
    jelAssert.fuzzy('OptionType([Float, String]).checkType(null)', 0);

    jelAssert.fuzzy('(Float|String|null).checkType(1)', 1);
    jelAssert.fuzzy('(Float|String|null).checkType("foo")', 1);
    jelAssert.fuzzy('(Float|String|null).checkType(null)', 1);
    jelAssert.fuzzy('(Float|String|null).checkType({})', 0);
    jelAssert.fuzzy('(Float|String|null).checkType({})', 0);
    jelAssert.fuzzy('(Float|null).checkType(100)', 1);
    jelAssert.fuzzy('(Float|null).checkType(null)', 1);
    jelAssert.fuzzy('(Float|null).checkType("a")', 0);

    jelAssert.fuzzy('OptionalType(Float).checkType(1)', 1);
    jelAssert.fuzzy('OptionalType(Float).checkType(null)', 1);
    jelAssert.fuzzy('OptionalType(Float).checkType("a")', 0);

    jelAssert.fuzzy('number?.checkType(1)', 1);
    jelAssert.fuzzy('number?.checkType(null)', 1);
    jelAssert.fuzzy('number?.checkType("a")', 0);

    jelAssert.fuzzy('let e1 = enum AEnum a,b,c: EnumType(e1).checkType(e1.a)', 1);
    jelAssert.fuzzy('let e1 = enum AEnum a,b,c: EnumType(e1).checkType(6)', 0);
    jelAssert.fuzzy('let e1 = enum AEnum a,b,c: let e2 = enum BEnum a,b,c: EnumType(e2).checkType(e1.a)', 0);
    jelAssert.fuzzy('let e1 = enum AEnum a,b,c: (e1)?.checkType(e1.a)', 1);
  });

  it('checks functions', function() {
    jelAssert.fuzzy('FunctionType().checkType(()=>1)', 1);
    jelAssert.fuzzy('FunctionType().checkType((a:int): any=>1)', 1);
    jelAssert.fuzzy('function.checkType(()=>1)', 1);
    jelAssert.fuzzy('function.checkType((a:int): any=>1)', 1);

    jelAssert.fuzzy('function(()=>1).checkType(()=>1)', 1);
    jelAssert.fuzzy('function((c,v)=>1).checkType((c,v)=>55)', 1);
    jelAssert.fuzzy('function((c,v)=>1).checkType((c,v,x)=>55)', 0);
    jelAssert.fuzzy('function((c,v,x)=>1).checkType((c,v)=>55)', 1);
    jelAssert.fuzzy('function((c,v,x)=>1, false).checkType((c,v)=>55)', 1);
    jelAssert.fuzzy('function((c,v)=>1).checkType((c,x)=>1)', 1);
    jelAssert.fuzzy('function((c,v)=>1, false).checkType((c,x)=>1)', 1);
    jelAssert.fuzzy('function((c,o): int=>1).checkType((c,o)=>55)', 1);
    jelAssert.fuzzy('function((c,o): int=>1, false).checkType((c,o)=>55)', 1);
    jelAssert.fuzzy('function((c,o): int=>1, true).checkType((c,o)=>55)', 0);
    jelAssert.fuzzy('function((c:int,o:int)=>1).checkType((c,o)=>55)', 1);
    jelAssert.fuzzy('function((c:int,o:int)=>1, false).checkType((c,o)=>55)', 1);
    jelAssert.fuzzy('function((c:int,o:int)=>1, true).checkType((c,o)=>55)', 0);
    jelAssert.fuzzy('function((c:int,o:int)=>1, false).checkType(c=>55)', 1);
    jelAssert.fuzzy('function((c:int,o:int): int=>1).checkType((c,o)=>55)', 1);
    jelAssert.fuzzy('function((c:int,o:int): int=>1, false).checkType((c,o)=>55)', 1);
    jelAssert.fuzzy('function((c:int,o:int): int=>1, true).checkType((c,o)=>55)', 0);
    jelAssert.fuzzy('function((c:int,v:int): int=>1, false).checkType((c,o)=>55)', 1);
    jelAssert.fuzzy('function((c:int,v:int): int=>1, true).checkType((c,o)=>55)', 0);
    jelAssert.fuzzy('function(()=>1).checkType((c)=>1)', 0);
    jelAssert.fuzzy('function(()=>1, false).checkType((c)=>1)', 0);
    jelAssert.fuzzy('function((c)=>1).checkType(()=>1)', 1);
    jelAssert.fuzzy('function((c)=>1, false).checkType(()=>1)', 1);
    jelAssert.fuzzy('function(()=>1).checkType("eek")', 0);
    jelAssert.fuzzy('FunctionType(()=>1).checkType("eek")', 0);
  });

  it('checks categories', function() {
    return JEL.execute(`[Category('VehicleCategory'), Category('DummyCategory')]`, '(inline)', ctx).then(cats=>db.put(ctx, ...cats.elements))
      .then(()=>JEL.execute(`[Category('TrainCategory', @VehicleCategory)]`, '(inline)', ctx)).then(cats=>db.put(ctx, ...cats.elements))
      .then(()=>Promise.all([jelAssert.equalPromise('@TrainCategory instanceof CategoryType(@TrainCategory)', 'true'),
                             jelAssert.equalPromise('@TrainCategory instanceof CategoryType(@VehicleCategory)', 'true'), 
                             jelAssert.equalPromise('@VehicleCategory instanceof CategoryType(@VehicleCategory)', 'true'), 
                             jelAssert.equalPromise('null instanceof CategoryType(@VehicleCategory)', 'false'), 
                             jelAssert.equalPromise('@DummyCategory instanceof CategoryType(@TrainCategory)', 'false')]));
  });

  it('checks things', function() {
    return JEL.execute(`[Category('LifeformCategory'), Category('Dummy2Category')]`, '(inline)', ctx).then(cats=>db.put(ctx, ...cats.elements))
      .then(()=>JEL.execute(`Category('AnimalCategory', @LifeformCategory)`, '(inline)', ctx)).then(t=>db.put(ctx, t))
      .then(()=>JEL.execute(`Category('CatCategory', @AnimalCategory)`, '(inline)', ctx)).then(t=>db.put(ctx, t))
      .then(()=>JEL.execute(`[Thing('GrumpyCat', @CatCategory), Thing('Flipper', @AnimalCategory)]`, '(inline)', ctx)).then(t=>db.put(ctx, ...t.elements))
      .then(()=>Promise.all([jelAssert.equalPromise('@GrumpyCat instanceof @CatCategory', 'true'), 
                            jelAssert.equalPromise('@GrumpyCat instanceof @AnimalCategory', 'true'), 
                            jelAssert.equalPromise('@GrumpyCat instanceof @LifeformCategory', 'true'), 
                            jelAssert.equalPromise('@CatCategory instanceof @AnimalCategory', 'false'), 
                            jelAssert.equalPromise('null instanceof @AnimalCategory', 'false'), 
                            jelAssert.equalPromise('@Flipper instanceof @AnimalCategory', 'true'), 
                            jelAssert.equalPromise('@Flipper instanceof @CatCategory', 'false'), 
                            jelAssert.equalPromise('@GrumpyCat instanceof @Dummy2Category', 'false')]));
  });

});

