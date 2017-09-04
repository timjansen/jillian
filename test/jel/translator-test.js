'use strict';

const assert = require('assert');
const JEL = require('../../src/jel/jel.js');
const Pattern = require('../../src/jel/pattern.js');
const Translator = require('../../src/jel/translator.js');
const Dictionary = require('../../src/jel/dictionary.js');
const Context = require('../../src/jel/context.js');
const PatternNode = require('../../src/jel/matchNodes/patternnode.js');
const TranslatorNode = require('../../src/jel/matchNodes/translatornode.js');
const {JelPromise, JelConsole} = require('./jel-assert.js');

const promiseCtx = new Context().setAll({JelPromise, JelConsole});


function parse(s) {
  return new JEL(s).parseTree;
}

function exec(s) {
  return parse(s).execute(new Context());
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
      assert.equal(translator(JEL.createPattern(`abc def`), parse('7')).toString(), "Translator(TranslatorNode(tokens={abc: TranslatorNode(tokens={def: TranslatorNode(results=[LambdaResultNode(7)])})}))");
      assert.equal(translator(JEL.createPattern(`abc`), parse('2'))
                                   .addPattern(JEL.createPattern(`foo`), parse('6'))
                                   .toString(), "Translator(TranslatorNode(tokens={abc: TranslatorNode(results=[LambdaResultNode(2)]),\nfoo: TranslatorNode(results=[LambdaResultNode(6)])}))");
      assert.equal(translator(JEL.createPattern(`abc def`), parse('2'))
                                   .addPattern(JEL.createPattern(`foo`), parse('6'))
                                   .addPattern(JEL.createPattern(`abc foo bar`), parse('4'))
                                   .toString(), "Translator(TranslatorNode(tokens={abc: TranslatorNode(tokens={def: TranslatorNode(results=[LambdaResultNode(2)]),\nfoo: TranslatorNode(tokens={bar: TranslatorNode(results=[LambdaResultNode(4)])})}),\nfoo: TranslatorNode(results=[LambdaResultNode(6)])}))");
    });

    it('should support meta data', function() {
      assert.equal(translator(JEL.createPattern(`abc`), parse('2'), createMap({x: true}))
                                   .toString(), "Translator(TranslatorNode(tokens={abc: TranslatorNode(results=[LambdaResultNode(2, meta={x=true})])}))");
      assert.equal(translator(JEL.createPattern(`abc`), parse('2'), createMap({x: true, y: true, z: true}))
                                   .toString(), "Translator(TranslatorNode(tokens={abc: TranslatorNode(results=[LambdaResultNode(2, meta={x=true, y=true, z=true})])}))");
      assert.equal(translator(JEL.createPattern(`abc`), parse('2'), createMap({x: true, y: 1, zzz: "bla"}))
                                   .toString(), "Translator(TranslatorNode(tokens={abc: TranslatorNode(results=[LambdaResultNode(2, meta={x=true, y=1, zzz=bla})])}))");
    });
    
    it('should support templates', function() {
        assert.equal(translator(JEL.createPattern('{{tpl1}}'), parse('7')).toString(), "Translator(TranslatorNode(templates=[TemplateNode(name=undefined, template=tpl1, metaFilter=[], expression=undefined) -> TranslatorNode(results=[LambdaResultNode(7)])]))");
        assert.equal(translator(JEL.createPattern('{{tpl1}}'), parse('7')).addPattern(JEL.createPattern('{{tpl0}}'), parse('9')).toString(), `Translator(TranslatorNode(templates=[TemplateNode(name=undefined, template=tpl1, metaFilter=[], expression=undefined) -> TranslatorNode(results=[LambdaResultNode(7)]),\nTemplateNode(name=undefined, template=tpl0, metaFilter=[], expression=undefined) -> TranslatorNode(results=[LambdaResultNode(9)])]))`);
        assert.equal(translator(JEL.createPattern('{{y:tpl1::y==3}}'), parse('7')).addPattern(JEL.createPattern('{{c:tpl0}}'), parse('9')).toString(), `Translator(TranslatorNode(templates=[TemplateNode(name=y, template=tpl1, metaFilter=[], expression=(y == 3)) -> TranslatorNode(results=[LambdaResultNode(7)]),\nTemplateNode(name=c, template=tpl0, metaFilter=[], expression=undefined) -> TranslatorNode(results=[LambdaResultNode(9)])]))`);
    });
  });

  describe('match()', function() {
    it('should match simple sentences', function() {
      const ctx = new Context();
      const t1 = new Translator().addPattern(JEL.createPattern(`abc def`), parse('7'));
      assert.equal(t1.match(ctx, "abc def").length, 1);
      assert.equal(t1.match(ctx, " abc  def ").get(0).value, 7);
      assert.equal(t1.match(ctx, "abc def def").length, 0);
      assert.equal(t1.match(ctx, "abcdef").length, 0);
      assert.equal(t1.match(ctx, "bla abc def cgd").length, 0);
      assert.equal(t1.match(ctx, "bla abc def").length, 0);
      assert.equal(t1.match(ctx, "abc gfh def").length, 0);
      
      const t2 = new Translator().addPattern(JEL.createPattern(`abc def`), parse('1'))
                                 .addPattern(JEL.createPattern(`abc`), parse('2'))
                                 .addPattern(JEL.createPattern(`xyz abc def`), parse('3'))
                                 .addPattern(JEL.createPattern(`xyz def abc def`), parse('4'));
      assert.equal(t2.match(ctx, " abc  def ").get(0).value, 1);
      assert.equal(t2.match(ctx, " abc  ").get(0).value, 2);
      assert.equal(t2.match(ctx, "xyz abc  def ").get(0).value, 3);
      assert.equal(t2.match(ctx, " xyz def abc  def ").get(0).value, 4);
      assert.equal(t2.match(ctx, " abc d def ").length, 0);
      assert.equal(t2.match(ctx, " abcdef ").length, 0);
    });

    it('should match options', function() {
      const ctx = new Context();
      const t0 = new Translator().addPattern(JEL.createPattern(`a [a]?`), parse('7'));
      assert.deepEqual(t0.match(ctx, "a").elements.map(e=>e.value), [7]);
      assert.deepEqual(t0.match(ctx, "a a").elements.map(e=>e.value), [7]);
      
      const t1 = new Translator().addPattern(JEL.createPattern(`[abc|def]? x`), parse('7'));
      assert.deepEqual(t1.match(ctx, "abc x").elements.map(e=>e.value), [7]);
      assert.deepEqual(t1.match(ctx, " abc  x ").elements.map(e=>e.value), [7]);
      assert.deepEqual(t1.match(ctx, " def x").elements.map(e=>e.value), [7]);
      assert.deepEqual(t1.match(ctx, "x").elements.map(e=>e.value), [7]);
      assert.equal(t1.match(ctx, "abc def x").length, 0);
      assert.equal(t1.match(ctx, "abcdefx").length, 0);
      assert.equal(t1.match(ctx, "abc cgd").length, 0);
      assert.equal(t1.match(ctx, "bla x").length, 0);
      
      const t2 = new Translator().addPattern(JEL.createPattern(`abc def`), parse('1'))
                                 .addPattern(JEL.createPattern(`[abc]? h`), parse('2'))
                                 .addPattern(JEL.createPattern(`[xyz|abc] def`), parse('3'));
      assert.equal(t2.match(ctx, " abc  def ").get(0).value, 1);
      assert.equal(t2.match(ctx, " abc h ").get(0).value, 2);
      assert.equal(t2.match(ctx, "xyz   def ").get(0).value, 3);
      assert.equal(t2.match(ctx, " xyz def abc  def ").length, 0);
      assert.equal(t2.match(ctx, " abc d def ").length, 0);
      assert.equal(t2.match(ctx, " abcdef ").length, 0);
    });

    it('should support meta', function() {
      const ctx = new Context();
      const t1 = new Translator().addPattern(JEL.createPattern(`abc`), parse('2'), createMap({x: true}));
      assert.equal(t1.match(ctx, "abc").length, 1);
      assert.equal(t1.match(ctx, "abc", new Set()).length, 1);
      assert.equal(t1.match(ctx, "abc", new Set('x')).length, 1);
      assert.equal(t1.match(ctx, "abc", new Set('x')).get(0).value, 2);
      assert.equal(t1.match(ctx, "abc", new Set('x')).get(0).meta.get('x'), true);
      assert.equal(t1.match(ctx, "abc", new Set('y')).length, 0);
      assert.equal(t1.match(ctx, "abcd", new Set('x')).length, 0);

      
      const t2 = new Translator().addPattern(JEL.createPattern(`abc`), parse('1'), createMap({x: true}))
                                 .addPattern(JEL.createPattern(`abc`), parse('2'), createMap({y: true}))
                                 .addPattern(JEL.createPattern(`xyz`), parse('3'), createMap({x: true, y: true}))
                                 .addPattern(JEL.createPattern(`xyz`), parse('4'), createMap({x: true, z: true}));
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
        const tpl2 = exec('{{`a [b [c]?]?` => 3, `a b c` => 4, `d e` => 5, `f {{tpl1}}` => 6, `a [{{tpl0}}]? h` => 7}}');
        const dict = new Dictionary({tpl0, tpl1, tpl2});
        const ctx = new Context(null, null, dict);

        assert.deepEqual(translator(JEL.createPattern('{{tpl0}}'), parse('5')).match(ctx, 'a').elements.map(e=>e.value), [5]);
        assert.deepEqual(translator(JEL.createPattern('{{tpl0}} {{tpl0}}'), parse('7')).match(ctx, 'a a').elements.map(e=>e.value), [7]);
        assert.deepEqual(translator(JEL.createPattern('{{tpl0}} {{tpl0}}'), parse('7')).match(ctx, 'b a a').elements.map(e=>e.value), []);
        assert.deepEqual(translator(JEL.createPattern('{{tpl0}} {{tpl0}}'), parse('7')).match(ctx, 'a a b').elements.map(e=>e.value), []);
        assert.deepEqual(translator(JEL.createPattern('{{tpl0}} {{tpl0}}'), parse('7')).match(ctx, 'a b').elements.map(e=>e.value), []);
        assert.deepEqual(translator(JEL.createPattern('a {{tpl0}} {{tpl0}} b'), parse('9')).match(ctx, 'a a a b').elements.map(e=>e.value), [9]);

        assert.deepEqual(translator(JEL.createPattern('a [{{tpl0}}]?'), parse('1')).match(ctx, 'a').elements.map(e=>e.value), [1]);
        assert.deepEqual(translator(JEL.createPattern('a [{{tpl0}}]?'), parse('1')).match(ctx, 'a a').elements.map(e=>e.value), [1]);
      
        assert.deepEqual(translator(JEL.createPattern('{{tpl1}}'), parse('7')).match(ctx, 'a').elements.map(e=>e.value), [7]);
        assert.deepEqual(translator(JEL.createPattern('{{tpl1}}'), parse('7')).match(ctx, 'b').elements.map(e=>e.value), [7, 7, 7]);

        assert.deepEqual(translator(JEL.createPattern('{{tpl1}}'), parse('7')).addPattern(JEL.createPattern('{{tpl0}}'), parse('9')).match(ctx, 'a').elements.map(e=>e.value), [7, 9]);
        assert.deepEqual(translator(JEL.createPattern('{{tpl0}}'), parse('7')).addPattern(JEL.createPattern('{{tpl1}}'), parse('9')).match(ctx, 'a').elements.map(e=>e.value), [7, 9]);
        assert.deepEqual(translator(JEL.createPattern('{{tpl0}}'), parse('7')).addPattern(JEL.createPattern('{{tpl1}}'), parse('9')).match(ctx, 'b').elements.map(e=>e.value), [9, 9, 9]);
        assert.deepEqual(translator(JEL.createPattern('{{tpl1}}'), parse('7')).addPattern(JEL.createPattern('{{tpl0}}'), parse('9')).match(ctx, 'b').elements.map(e=>e.value), [7, 7, 7]);
        assert.deepEqual(translator(JEL.createPattern('a {{tpl1}} b'), parse('7')).addPattern(JEL.createPattern('{{tpl0}} {{tpl0}} b'), parse('9')).match(ctx, 'a a b').elements.map(e=>e.value), [7, 9]);
        assert.deepEqual(translator(JEL.createPattern('{{tpl1}} {{tpl1}}'), parse('7')).addPattern(JEL.createPattern('{{tpl0}}'), parse('9')).match(ctx, 'a a').elements.map(e=>e.value), [7]);

        assert.deepEqual(translator(JEL.createPattern('{{t: tpl0 }}'), parse('1')).addPattern(JEL.createPattern('{{t: tpl0}}'), parse('2')).match(ctx, 'a').elements.map(e=>e.value), [1,2]);
        assert.deepEqual(translator(JEL.createPattern('{{t: tpl0 :: t == 2}}'), parse('1')).addPattern(JEL.createPattern('{{t: tpl0 :: t == 1}}'), parse('2')).match(ctx, 'a').elements.map(e=>e.value), [2]);

        assert.deepEqual(translator(JEL.createPattern('{{t: tpl1 }} {{u: tpl0 :: t == 1}}'), parse('t')).addPattern(JEL.createPattern('{{t: tpl0}}'), parse('0')).match(ctx, 'a a').elements.map(e=>e.value), [1]);
        assert.deepEqual(translator(JEL.createPattern('{{t: tpl1 }} {{u: tpl0 :: t == 2}}'), parse('t')).addPattern(JEL.createPattern('{{t: tpl0}}'), parse('0')).match(ctx, 'b a').elements.map(e=>e.value), [2]);
        assert.deepEqual(translator(JEL.createPattern('{{t: tpl1 }} {{u: tpl0 :: t == 1}}'), parse('t')).addPattern(JEL.createPattern('{{t: tpl0}}'), parse('0')).match(ctx, 'a').elements.map(e=>e.value), [0]);
      
        const t0 = translator(JEL.createPattern('{{t: tpl2}}'), parse('t'));
        assert.deepEqual(t0.match(ctx, 'a').elements.map(e=>e.value), [3]);
        assert.deepEqual(t0.match(ctx, 'a b c').elements.map(e=>e.value), [3, 4]);
        assert.deepEqual(t0.match(ctx, 'd e').elements.map(e=>e.value), [5]);
        assert.deepEqual(t0.match(ctx, 'f a').elements.map(e=>e.value), [6]);
        assert.deepEqual(t0.match(ctx, 'a h').elements.map(e=>e.value), [7]);
        assert.deepEqual(t0.match(ctx, 'a a h').elements.map(e=>e.value), [7]);
    });
    
    it('should parse real sentences', function() {
        const animals = exec('{{small: `dog` => "dog", small: `cat` => "cat", big: `cow` => "cow"}}');
        const animalSounds = exec('{{`woof` => "dog", `meow` => "cat", `moo` => "cow"}}');
        const verbs = exec('{{`walks` => "walks", `sleeps` => "sleeps", `says` => "says"}}');
        const dict = new Dictionary({animals, animalSounds, verbs});
        const ctx = new Context(null, null, dict);

        const sounds = translator(JEL.createPattern('the {{animals}} says {{animalSounds}}'), parse('true'));
        assert.deepEqual(sounds.match(ctx, "the dog says woof").elements.map(e=>e.value), [true]);
        assert.deepEqual(sounds.match(ctx, "the cat says meow").elements.map(e=>e.value), [true]);
        assert.deepEqual(sounds.match(ctx, "the fish says meow").elements.map(e=>e.value), []);
        assert.deepEqual(sounds.match(ctx, "the woof says dog").elements.map(e=>e.value), []);
        assert.deepEqual(sounds.match(ctx, "dog says meow").elements.map(e=>e.value), []);
        assert.deepEqual(sounds.match(ctx, "the cat says meow or something like that").elements.map(e=>e.value), []);

        const soundsValidating = translator(JEL.createPattern('the {{a: animals}} says {{s: animalSounds :: s == a}}'), parse('a'));
        assert.deepEqual(soundsValidating.match(ctx, "the dog says woof").elements.map(e=>e.value), ["dog"]);
        assert.deepEqual(soundsValidating.match(ctx, "the cat says meow").elements.map(e=>e.value), ["cat"]);
        assert.deepEqual(soundsValidating.match(ctx, "the dog says meow").elements.map(e=>e.value), []);

        const soundsMeta = translator(JEL.createPattern('the {{a: animals.small}} says {{s: animalSounds :: s == a}}'), parse('true'));
        assert.deepEqual(soundsMeta.match(ctx, "the dog says woof").elements.map(e=>e.value), [true]);
        assert.deepEqual(soundsMeta.match(ctx, "the cow says woof").elements.map(e=>e.value), []);
        assert.deepEqual(soundsMeta.match(ctx, "the cow says moo").elements.map(e=>e.value), []);
      
        const soundsVerb = translator(JEL.createPattern('the {{animals}} {{verbs}} [{{animalSounds}}]?'), parse('1'))
          .addPattern(JEL.createPattern('the {{animals.small}} says {{animalSounds}}'), parse('2'));
        assert.deepEqual(soundsVerb.match(ctx, "the dog says woof").elements.map(e=>e.value), [1, 2]);
        assert.deepEqual(soundsVerb.match(ctx, "the dog says moo").elements.map(e=>e.value), [1, 2]);
        assert.deepEqual(soundsVerb.match(ctx, "the cow says moo").elements.map(e=>e.value), [1]);
        assert.deepEqual(soundsVerb.match(ctx, "the dog sleeps").elements.map(e=>e.value), [1]);
        assert.deepEqual(soundsVerb.match(ctx, "the cow sleeps").elements.map(e=>e.value), [1]);
        assert.deepEqual(soundsVerb.match(ctx, "and now something completely different").elements.map(e=>e.value), []);
    });

    it('should support promises as result', function() {
        const t = translator(JEL.createPattern('the cat says meow'), parse('JelPromise.resolve(1)'))
                .addPattern(JEL.createPattern('the dog barks [woof|meow]?'), parse('JelPromise(5)'));

      return Promise.all([
          t.match(promiseCtx, "the cat says meow").then(r=>assert.deepEqual(r.elements.map(e=>e.value), [1])),
          t.match(promiseCtx, "the dog barks").then(r=>assert.deepEqual(r.elements.map(e=>e.value), [5])),
          t.match(promiseCtx, "the dog barks meow").then(r=>assert.deepEqual(r.elements.map(e=>e.value), [5]))
        ]);
    });

    
    it('should support promises in templates', function() {
        const animals = parse('{{small: `dog` => JelPromise("dog"), small: `cat` => JelPromise.resolve("cat"), big: `cow` => "cow"}}').execute(promiseCtx);
        const dict = new Dictionary({animals});
        const ctx = new Context(promiseCtx, null, dict);

        const t = translator(JEL.createPattern('the {{animals}} barks'), parse('JelPromise.resolve(1)'))
           .addPattern(JEL.createPattern('the {{a: animals}} says [woof|meow|moo]?'), parse('a'))
           .addPattern(JEL.createPattern('the {{a: animals :: a!="dog"}} says meow'), parse('a+"boo"'))

        assert.deepEqual(t.match(ctx, "the cow says moo").elements.map(e=>e.value), ["cow"]);
        assert.deepEqual(t.match(ctx, "the cow says meow").elements.map(e=>e.value), ["cow", "cowboo"]);
        
        return Promise.all([
          t.match(ctx, "the dog barks").then(r=>assert.deepEqual(r.elements.map(e=>e.value), [1])),
          t.match(ctx, "the cat barks").then(r=>assert.deepEqual(r.elements.map(e=>e.value), [1])),
          t.match(ctx, "the cow barks").then(r=>assert.deepEqual(r.elements.map(e=>e.value), [1])),
          t.match(ctx, "the dog says woof").then(r=>assert.deepEqual(r.elements.map(e=>e.value), ["dog"])),
          t.match(ctx, "the cat says meow").then(r=>assert.deepEqual(r.elements.map(e=>e.value), ["cat", "catboo"])),
          t.match(ctx, "the dog says meow").then(r=>assert.deepEqual(r.elements.map(e=>e.value), ["dog"]))
        ]);
    });


  });
  
});

