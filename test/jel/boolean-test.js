'use strict';

require('source-map-support').install();
const DefaultContext = require('../../build/jel/DefaultContext.js').default;
const JelBoolean = require('../../build/jel/types/JelBoolean.js').default;
const NativeClass = require('../../build/jel/NativeClass.js').default;
const {JelAssert, JelPromise, JelConsole} = require('../jel-assert.js');
const jelAssert = new JelAssert();


describe('JelBoolean', function() {
  let ctx;
  before(function(){
    return DefaultContext.get().then(dc=> {
      ctx = dc;
      jelAssert.setCtx(ctx);
    });
  });

  it('creates and serializes', function() {
    jelAssert.equal(new JelBoolean(0), "Boolean(0)");
    jelAssert.equal(new JelBoolean(1), "Boolean(1)");
    jelAssert.equal(new JelBoolean(0.34), "Boolean(0.34)");
    jelAssert.notEqual(new JelBoolean(1), "Boolean(3)");
  });

  it('supports JelBoolean<->JelBoolean comparisons', function() {
    jelAssert.equal(JelBoolean.TRUE, "Boolean(1) == Boolean(1)");
    jelAssert.equal(JelBoolean.TRUE, "Boolean(0) == Boolean(0)");
    jelAssert.equal(JelBoolean.TRUE, "Boolean(0.6) == Boolean(0.6)");
    jelAssert.equal(JelBoolean.TRUE, "Boolean(0.75) != Boolean(0.25)");
    jelAssert.equal(JelBoolean.TRUE, "Boolean(1) != Boolean(0)");
    jelAssert.equal(JelBoolean.FALSE, "Boolean(1) != Boolean(1)");
    jelAssert.equal(JelBoolean.FALSE, "Boolean(0) != Boolean(0)");
    jelAssert.equal(JelBoolean.FALSE, "Boolean(0.6) != Boolean(0.6)");
    jelAssert.equal(JelBoolean.FALSE, "Boolean(0.75) == Boolean(0.25)");
    jelAssert.equal(JelBoolean.FALSE, "Boolean(1) == Boolean(0)");
    jelAssert.equal(JelBoolean.TRUE, "Boolean(1, 15) == Boolean(1, 33)");
    jelAssert.equal(JelBoolean.TRUE, "Boolean(0, 5) == Boolean(0)");
    jelAssert.equal(JelBoolean.TRUE, "Boolean(0.2, 10) == Boolean(0.2, 10)");

    jelAssert.equal(JelBoolean.TRUE, "Boolean(1) === Boolean(1)");
    jelAssert.equal(JelBoolean.TRUE, "Boolean(0) === Boolean(0)");
    jelAssert.equal(JelBoolean.TRUE, "Boolean(0.6) === Boolean(0.6)");
    jelAssert.equal(JelBoolean.TRUE, "Boolean(0.75) !== Boolean(0.25)");
    jelAssert.equal(JelBoolean.TRUE, "Boolean(1) !== Boolean(0)");
    jelAssert.equal(JelBoolean.FALSE, "Boolean(1) !== Boolean(1)");

    jelAssert.equal(JelBoolean.TRUE, "Boolean(1) > Boolean(0)");
    jelAssert.equal(JelBoolean.TRUE, "Boolean(0.7) > Boolean(0.3)");
    jelAssert.equal(JelBoolean.FALSE, "Boolean(1) > Boolean(1)");
    jelAssert.equal(JelBoolean.FALSE, "Boolean(0.5) > Boolean(1)");
    jelAssert.equal(JelBoolean.FALSE, "Boolean(1) < Boolean(0)");
    jelAssert.equal(JelBoolean.TRUE, "Boolean(0) >= Boolean(0)");
    jelAssert.equal(JelBoolean.TRUE, "Boolean(0) <= Boolean(0.1)");
    jelAssert.equal(JelBoolean.TRUE, "Boolean(1) >> Boolean(0)");
    jelAssert.equal(JelBoolean.FALSE, "Boolean(0.5) >> Boolean(1)");
    jelAssert.equal(JelBoolean.FALSE, "Boolean(1) << Boolean(0)");
    jelAssert.equal(JelBoolean.TRUE, "Boolean(0) >>= Boolean(0)");
    jelAssert.equal(JelBoolean.TRUE, "Boolean(0) <<= Boolean(0.1)");
  });

  it('supports state property', function() {
    jelAssert.equal(JelBoolean.TRUE, "Boolean(1).state == 1");
    jelAssert.equal(JelBoolean.TRUE, "1 == Boolean(1).state");
    jelAssert.equal(JelBoolean.TRUE, "Boolean(0).state == 0");
    jelAssert.equal(JelBoolean.TRUE, "Boolean(0.6).state == 0.6");
    jelAssert.equal(JelBoolean.TRUE, "Boolean(0).state != 0.2");
    jelAssert.equal(JelBoolean.FALSE, "1 == Boolean(0).state");
  });

  it('supports and and or', function() {
    jelAssert.equal("Boolean.and(true, true, true, true)", JelBoolean.TRUE);
    jelAssert.equal("Boolean.and(true, true, false, true)", JelBoolean.FALSE);
    jelAssert.equal("Boolean.and(false, false, false, true)", JelBoolean.FALSE);
    jelAssert.equal("Boolean.and(false, false, false, false)", JelBoolean.FALSE);

    jelAssert.equal("Boolean.or(true, true, true, true)", JelBoolean.TRUE);
    jelAssert.equal("Boolean.or(true, true, false, true)", JelBoolean.TRUE);
    jelAssert.equal("Boolean.or(false, false, false, true)", JelBoolean.TRUE);
    jelAssert.equal("Boolean.or(false, false, false, false)", JelBoolean.FALSE);

    jelAssert.equal("Boolean.TRUE.and(true)", JelBoolean.TRUE);
    jelAssert.equal("Boolean.TRUE.and(false)", JelBoolean.FALSE);
    jelAssert.equal("Boolean.FALSE.and(true)", JelBoolean.FALSE);
    jelAssert.equal("Boolean.FALSE.and(false)", JelBoolean.FALSE);

    jelAssert.equal("Boolean.TRUE.or(true)", JelBoolean.TRUE);
    jelAssert.equal("Boolean.TRUE.or(false)", JelBoolean.TRUE);
    jelAssert.equal("Boolean.FALSE.or(true)", JelBoolean.TRUE);
    jelAssert.equal("Boolean.FALSE.or(false)", JelBoolean.FALSE);

  });
});

