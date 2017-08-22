'use strict';

const assert = require('assert');
const JEL = require('../../src/jel/jel.js');
const Pattern = require('../../src/jel/pattern.js');
const Translator = require('../../src/jel/translator.js');
const Context = require('../../src/jel/context.js');
const PatternNode = require('../../src/jel/matchNodes/patternnode.js');
const TranslatorNode = require('../../src/jel/matchNodes/translatornode.js');

function exec(s) {
  return new JEL(s).executeImmediately();
}

function createMap(obj) {
  const m = new Map();
  for (let k in obj) 
    m.set(k, obj[k]);
  return m;
}

describe('jelTranslators', function() {
  describe('addPattern()', function() {
    
    it('should should build parsing trees', function() {
      assert.equal(new Translator().addPattern(JEL.createPattern(`abc def`), exec('() => 7')).toString(), "Translator(TranslatorNode(tokens={abc: TranslatorNode(tokens={def: TranslatorNode(results=[LambdaResultNode(()=>7)])})}))");
      assert.equal(new Translator().addPattern(JEL.createPattern(`abc`), exec('() => 2'))
                                   .addPattern(JEL.createPattern(`foo`), exec('() => 6'))
                                   .toString(), "Translator(TranslatorNode(tokens={abc: TranslatorNode(results=[LambdaResultNode(()=>2)]),\nfoo: TranslatorNode(results=[LambdaResultNode(()=>6)])}))");
      assert.equal(new Translator().addPattern(JEL.createPattern(`abc def`), exec('() => 2'))
                                   .addPattern(JEL.createPattern(`foo`), exec('() => 6'))
                                   .addPattern(JEL.createPattern(`abc foo bar`), exec('() => 4'))
                                   .toString(), "Translator(TranslatorNode(tokens={abc: TranslatorNode(tokens={def: TranslatorNode(results=[LambdaResultNode(()=>2)]),\nfoo: TranslatorNode(tokens={bar: TranslatorNode(results=[LambdaResultNode(()=>4)])})}),\nfoo: TranslatorNode(results=[LambdaResultNode(()=>6)])}))");
    });

    it('should support meta data', function() {
      assert.equal(new Translator().addPattern(JEL.createPattern(`abc`), exec('() => 2'), createMap({x: true}))
                                   .toString(), "Translator(TranslatorNode(tokens={abc: TranslatorNode(results=[LambdaResultNode(()=>2, meta={x=true})])}))");
      assert.equal(new Translator().addPattern(JEL.createPattern(`abc`), exec('() => 2'), createMap({x: true, y: true, z: true}))
                                   .toString(), "Translator(TranslatorNode(tokens={abc: TranslatorNode(results=[LambdaResultNode(()=>2, meta={x=true, y=true, z=true})])}))");
      assert.equal(new Translator().addPattern(JEL.createPattern(`abc`), exec('() => 2'), createMap({x: true, y: 1, zzz: "bla"}))
                                   .toString(), "Translator(TranslatorNode(tokens={abc: TranslatorNode(results=[LambdaResultNode(()=>2, meta={x=true, y=1, zzz=bla})])}))");
    });
  });

  describe('match()', function() {
    it('should match simple sentences', function() {
      const ctx = new Context();
      const t1 = new Translator().addPattern(JEL.createPattern(`abc def`), exec('() => 7'));
      assert.equal(t1.match(ctx, "abc def").length, 1);
      assert.equal(t1.match(ctx, " abc  def ").get(0).value, 7);
      assert.equal(t1.match(ctx, "abc def def").length, 0);
      assert.equal(t1.match(ctx, "abcdef").length, 0);
      assert.equal(t1.match(ctx, "bla abc def cgd").length, 0);
      assert.equal(t1.match(ctx, "bla abc def").length, 0);
      assert.equal(t1.match(ctx, "abc gfh def").length, 0);
      
      const t2 = new Translator().addPattern(JEL.createPattern(`abc def`), exec('() => 1'))
                                 .addPattern(JEL.createPattern(`abc`), exec('() => 2'))
                                 .addPattern(JEL.createPattern(`xyz abc def`), exec('() => 3'))
                                 .addPattern(JEL.createPattern(`xyz def abc def`), exec('() => 4'));
      assert.equal(t2.match(ctx, " abc  def ").get(0).value, 1);
      assert.equal(t2.match(ctx, " abc  ").get(0).value, 2);
      assert.equal(t2.match(ctx, "xyz abc  def ").get(0).value, 3);
      assert.equal(t2.match(ctx, " xyz def abc  def ").get(0).value, 4);
      assert.equal(t2.match(ctx, " abc d def ").length, 0);
      assert.equal(t2.match(ctx, " abcdef ").length, 0);
    });
    
    it('should support meta', function() {
      const ctx = new Context();
      const t1 = new Translator().addPattern(JEL.createPattern(`abc`), exec('() => 2'), createMap({x: true}));
      assert.equal(t1.match(ctx, "abc").length, 1);
      assert.equal(t1.match(ctx, "abc", new Set()).length, 1);
      assert.equal(t1.match(ctx, "abc", new Set('x')).length, 1);
      assert.equal(t1.match(ctx, "abc", new Set('x')).get(0).value, 2);
      assert.equal(t1.match(ctx, "abc", new Set('x')).get(0).meta.get('x'), true);
      assert.equal(t1.match(ctx, "abc", new Set('y')).length, 0);
      assert.equal(t1.match(ctx, "abcd", new Set('x')).length, 0);

      
      const t2 = new Translator().addPattern(JEL.createPattern(`abc`), exec('() => 1'), createMap({x: true}))
                                 .addPattern(JEL.createPattern(`abc`), exec('() => 2'), createMap({y: true}))
                                 .addPattern(JEL.createPattern(`xyz`), exec('() => 3'), createMap({x: true, y: true}))
                                 .addPattern(JEL.createPattern(`xyz`), exec('() => 4'), createMap({x: true, z: true}));
      assert.equal(t2.match(ctx, "abc").length, 2);
      assert.equal(t2.match(ctx, "abc", new Set()).length, 2);
      assert.equal(t2.match(ctx, "abc", new Set('x')).length, 1);
      assert.equal(t2.match(ctx, "abc", new Set('y')).length, 1);
      assert.equal(t2.match(ctx, "abc", new Set('x')).get(0).value, 1);
      assert.equal(t2.match(ctx, "abc", new Set('y')).get(0).value, 2);
      assert.equal(t2.match(ctx, "abc", new Set(['x', 'y'])).length, 0);
      assert.equal(t2.match(ctx, "abc", new Set('y')).get(0).meta.get('y'), true);
      assert.equal(t2.match(ctx, "abc", new Set('y')).get(0).meta.has('x'), false);
      
      assert.equal(t2.match(ctx, "xyz", new Set('x')).length, 2);
      assert.equal(t2.match(ctx, "xyz", new Set(['x', 'y'])).length, 1);
      assert.equal(t2.match(ctx, "xyz", new Set(['x', 'y'])).get(0).value, 3);
    });
  });
  
});

