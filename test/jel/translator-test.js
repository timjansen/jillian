'use strict';

const assert = require('assert');
const JEL = require('../../src/jel/jel.js');
const Pattern = require('../../src/jel/pattern.js');
const Translator = require('../../src/jel/translator.js');
const Dictionary = require('../../src/jel/dictionary.js');
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

function translator(pattern, expression, meta) {
  return new Translator().addPattern(pattern, expression, meta);
}

describe('jelTranslators', function() {
  describe('addPattern()', function() {
    
    it('should should build parsing trees', function() {
      assert.equal(translator(JEL.createPattern(`abc def`), exec('() => 7')).toString(), "Translator(TranslatorNode(tokens={abc: TranslatorNode(tokens={def: TranslatorNode(results=[LambdaResultNode(()=>7)])})}))");
      assert.equal(translator(JEL.createPattern(`abc`), exec('() => 2'))
                                   .addPattern(JEL.createPattern(`foo`), exec('() => 6'))
                                   .toString(), "Translator(TranslatorNode(tokens={abc: TranslatorNode(results=[LambdaResultNode(()=>2)]),\nfoo: TranslatorNode(results=[LambdaResultNode(()=>6)])}))");
      assert.equal(translator(JEL.createPattern(`abc def`), exec('() => 2'))
                                   .addPattern(JEL.createPattern(`foo`), exec('() => 6'))
                                   .addPattern(JEL.createPattern(`abc foo bar`), exec('() => 4'))
                                   .toString(), "Translator(TranslatorNode(tokens={abc: TranslatorNode(tokens={def: TranslatorNode(results=[LambdaResultNode(()=>2)]),\nfoo: TranslatorNode(tokens={bar: TranslatorNode(results=[LambdaResultNode(()=>4)])})}),\nfoo: TranslatorNode(results=[LambdaResultNode(()=>6)])}))");
    });

    it('should support meta data', function() {
      assert.equal(translator(JEL.createPattern(`abc`), exec('() => 2'), createMap({x: true}))
                                   .toString(), "Translator(TranslatorNode(tokens={abc: TranslatorNode(results=[LambdaResultNode(()=>2, meta={x=true})])}))");
      assert.equal(translator(JEL.createPattern(`abc`), exec('() => 2'), createMap({x: true, y: true, z: true}))
                                   .toString(), "Translator(TranslatorNode(tokens={abc: TranslatorNode(results=[LambdaResultNode(()=>2, meta={x=true, y=true, z=true})])}))");
      assert.equal(translator(JEL.createPattern(`abc`), exec('() => 2'), createMap({x: true, y: 1, zzz: "bla"}))
                                   .toString(), "Translator(TranslatorNode(tokens={abc: TranslatorNode(results=[LambdaResultNode(()=>2, meta={x=true, y=1, zzz=bla})])}))");
    });
    
    it('should support templates', function() {
        assert.equal(translator(JEL.createPattern('{{tpl1}}'), exec('() => 7')).toString(), "Translator(TranslatorNode(templates=[TemplateNode(name=undefined, template=tpl1, metaFilter=[], expression=undefined) -> TranslatorNode(results=[LambdaResultNode(()=>7)])]))");
        assert.equal(translator(JEL.createPattern('{{tpl1}}'), exec('() => 7')).addPattern(JEL.createPattern('{{tpl0}}'), exec('() => 9')).toString(), `Translator(TranslatorNode(templates=[TemplateNode(name=undefined, template=tpl1, metaFilter=[], expression=undefined) -> TranslatorNode(results=[LambdaResultNode(()=>7)]),\nTemplateNode(name=undefined, template=tpl0, metaFilter=[], expression=undefined) -> TranslatorNode(results=[LambdaResultNode(()=>9)])]))`);
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
    
    it('should support templates', function() {
        const tpl0 = exec('{{`a` => 1}}');
        const tpl1 = exec('{{`a` => 1, x: `b` => 2, y: `b` => 12, x, y: `b` => 22}}');
        const tpl2 = exec('{{`a [b [c]?]?` => 3, `a b c` => 4, `d e` => 5, `f {{tpl1}}` => 6}}');
        const dict = new Dictionary({tpl0, tpl1, tpl2});
        const ctx = new Context({}, null, null, dict);

        assert.deepEqual(translator(JEL.createPattern('{{tpl0}}'), exec('() => 5')).match(ctx, 'a').elements.map(e=>e.value), [5]);
        assert.deepEqual(translator(JEL.createPattern('{{tpl0}} {{tpl0}}'), exec('() => 7')).match(ctx, 'a a').elements.map(e=>e.value), [7]);
        assert.deepEqual(translator(JEL.createPattern('{{tpl0}} {{tpl0}}'), exec('() => 7')).match(ctx, 'b a a').elements.map(e=>e.value), []);
        assert.deepEqual(translator(JEL.createPattern('{{tpl0}} {{tpl0}}'), exec('() => 7')).match(ctx, 'a a b').elements.map(e=>e.value), []);
        assert.deepEqual(translator(JEL.createPattern('{{tpl0}} {{tpl0}}'), exec('() => 7')).match(ctx, 'a b').elements.map(e=>e.value), []);
        assert.deepEqual(translator(JEL.createPattern('a {{tpl0}} {{tpl0}} b'), exec('() => 9')).match(ctx, 'a a a b').elements.map(e=>e.value), [9]);
      
        assert.deepEqual(translator(JEL.createPattern('{{tpl1}}'), exec('() => 7')).match(ctx, 'a').elements.map(e=>e.value), [7]);
        assert.deepEqual(translator(JEL.createPattern('{{tpl1}}'), exec('() => 7')).match(ctx, 'b').elements.map(e=>e.value), [7, 7, 7]);
        assert.deepEqual(translator(JEL.createPattern('{{tpl1}}'), exec('() => 7')).addPattern(JEL.createPattern('{{tpl0}}'), exec('() => 9')).match(ctx, 'a').elements.map(e=>e.value), [7, 9]);
        assert.deepEqual(translator(JEL.createPattern('{{tpl0}}'), exec('() => 7')).addPattern(JEL.createPattern('{{tpl1}}'), exec('() => 9')).match(ctx, 'a').elements.map(e=>e.value), [7, 9]);
        assert.deepEqual(translator(JEL.createPattern('{{tpl0}}'), exec('() => 7')).addPattern(JEL.createPattern('{{tpl1}}'), exec('() => 9')).match(ctx, 'b').elements.map(e=>e.value), [9, 9, 9]);
        assert.deepEqual(translator(JEL.createPattern('{{tpl1}}'), exec('() => 7')).addPattern(JEL.createPattern('{{tpl0}}'), exec('() => 9')).match(ctx, 'b').elements.map(e=>e.value), [7, 7, 7]);
        assert.deepEqual(translator(JEL.createPattern('a {{tpl1}} b'), exec('() => 7')).addPattern(JEL.createPattern('{{tpl0}} {{tpl0}} b'), exec('() => 9')).match(ctx, 'a a b').elements.map(e=>e.value), [7, 9]);
        assert.deepEqual(translator(JEL.createPattern('{{tpl1}} {{tpl1}}'), exec('() => 7')).addPattern(JEL.createPattern('{{tpl0}}'), exec('() => 9')).match(ctx, 'a a').elements.map(e=>e.value), [7]);
    });
  });
  
});

