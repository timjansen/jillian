'use strict';

require('source-map-support').install();
const DefaultContext = require('../../build/jel/DefaultContext.js').default;
const JelBoolean = require('../../build/jel/types/JelBoolean.js').default;
const List = require('../../build/jel/types/List.js').default;
const Enum = require('../../build/jel/types/Enum.js').default;
const EnumValue = require('../../build/jel/types/EnumValue.js').default;
const DbRef = require('../../build/database/DbRef.js').default;
const Database = require('../../build/database/Database.js').default;
const DbSession = require('../../build/database/DbSession.js').default;
const {JelAssert, JelPromise, JelConsole} = require('../jel-assert.js');

const jelAssert = new JelAssert();

describe('EnumValue', function() {
  let ctx;
  before(function(){
    return DefaultContext.get().then(dc=> {
      ctx = dc;
      jelAssert.setCtx(ctx);
    });
  });
  
  it('creates and serializes', function() {
    jelAssert.equal(new Enum("SomeEnum", new List(['A', 'B', 'C'])), 'Enum("SomeEnum", ["A", "B", "C"])');
    jelAssert.equal('enum SomeEnum: A, B, C', 'Enum("SomeEnum", ["A", "B", "C"])');
  });

  it('supports EnumValue<->EnumValue comparisons', function() {
    jelAssert.equal(JelBoolean.TRUE, "(enum FooEnum: Bar).Bar == (enum FooEnum: Bar).Bar");
    jelAssert.equal(JelBoolean.FALSE, "(enum FooEnum: Bar).Bar != (enum FooEnum: Bar).Bar");
    jelAssert.equal(JelBoolean.FALSE, "(enum FooEnum: Bar).Bar == (enum NopeEnum: Bar).Bar");
    jelAssert.equal(JelBoolean.FALSE, "(enum FooEnum: Bar).Bar == (enum FooEnum: Nope).Nope");
    jelAssert.equal(JelBoolean.TRUE, "(enum FooEnum: Bar).Bar != (enum NopeEnum: Bar).Bar");
    jelAssert.equal(JelBoolean.TRUE, "(enum FooEnum: Bar).Bar != (enum FooEnum: Nope).Nope");
  });

  it('supports EnumValue<->string comparisons', function() {
    jelAssert.equal(JelBoolean.TRUE, "(enum BarEnum: Foo).Foo == 'Foo'");
    jelAssert.equal(JelBoolean.FALSE, "(enum BarEnum: Foo).Foo != 'Foo'");
    jelAssert.equal(JelBoolean.FALSE, "(enum BarEnum: Foo).Foo == 'Nope'");
    jelAssert.equal(JelBoolean.TRUE, "(enum BarEnum: Foo).Foo != 'Nope'");
  });
});
