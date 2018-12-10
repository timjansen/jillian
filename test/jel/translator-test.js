'use strict';

require('source-map-support').install();
const assert = require('assert');
const Context = require('../../build/jel/Context.js').default;
const DefaultContext = require('../../build/jel/DefaultContext.js').default;
const NativeClass = require('../../build/jel/NativeClass.js').default;
const JEL = require('../../build/jel/JEL.js').default;
const JelString = require('../../build/jel/types/JelString.js').default;
const Pattern = require('../../build/jel/types/Pattern.js').default;
const Translator = require('../../build/jel/types/Translator.js').default;
const Dictionary = require('../../build/jel/types/Dictionary.js').default;
const PatternNode = require('../../build/jel/patternNodes/PatternNode.js').default;
const TranslatorNode = require('../../build/jel/patternNodes/TranslatorNode.js').default;
const {JelPromise, JelConsole} = require('../jel-assert.js');

const promiseCtx = DefaultContext.plus({JelPromise: new NativeClass(JelPromise), JelConsole: new NativeClass(JelConsole)});

function exec(s) {
  return JEL.parseTree(s).execute(DefaultContext.get());
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
      assert.equal(translator(JEL.createPattern(`abc def`), JEL.parseTree('7')).toString(), "Translator(TranslatorNode(tokens={abc: TranslatorNode(tokens={def: TranslatorNode(tokens={} results=[LambdaResultNode(7)])})}))");
      assert.equal(translator(JEL.createPattern(`abc`), JEL.parseTree('2'))
                                   .addPattern(JEL.createPattern(`foo`), JEL.parseTree('6'))
                                   .toString(), "Translator(TranslatorNode(tokens={abc: TranslatorNode(tokens={} results=[LambdaResultNode(2)]),\nfoo: TranslatorNode(tokens={} results=[LambdaResultNode(6)])}))");
      assert.equal(translator(JEL.createPattern(`abc def`), JEL.parseTree('2'))
                                   .addPattern(JEL.createPattern(`foo`), JEL.parseTree('6'))
                                   .addPattern(JEL.createPattern(`abc foo bar`), JEL.parseTree('4'))
                                   .toString(), "Translator(TranslatorNode(tokens={abc: TranslatorNode(tokens={def: TranslatorNode(tokens={} results=[LambdaResultNode(2)]),\nfoo: TranslatorNode(tokens={bar: TranslatorNode(tokens={} results=[LambdaResultNode(4)])})}),\nfoo: TranslatorNode(tokens={} results=[LambdaResultNode(6)])}))");
    });

    it('should support meta data', function() {
      assert.equal(translator(JEL.createPattern(`abc`), JEL.parseTree('2'), createMap({x: true}))
                                   .toString(), "Translator(TranslatorNode(tokens={abc: TranslatorNode(tokens={} results=[LambdaResultNode(2, meta={x=true})])}))");
      assert.equal(translator(JEL.createPattern(`abc`), JEL.parseTree('2'), createMap({x: true, y: true, z: true}))
                                   .toString(), "Translator(TranslatorNode(tokens={abc: TranslatorNode(tokens={} results=[LambdaResultNode(2, meta={x=true, y=true, z=true})])}))");
      assert.equal(translator(JEL.createPattern(`abc`), JEL.parseTree('2'), createMap({x: true, y: 1, zzz: "bla"}))
                                   .toString(), "Translator(TranslatorNode(tokens={abc: TranslatorNode(tokens={} results=[LambdaResultNode(2, meta={x=true, y=1, zzz=\"bla\"})])}))");
    });
    
    it('should support templates', function() {
        assert.equal(translator(JEL.createPattern('{{tpl1}}'), JEL.parseTree('7')).toString(), "Translator(TranslatorNode(tokens={} complex=[TemplateNode(name=undefined, template=tpl1, metaFilter=[], expression=undefined) -> TranslatorNode(tokens={} results=[LambdaResultNode(7)])]))");
        assert.equal(translator(JEL.createPattern('{{tpl1}}'), JEL.parseTree('7')).addPattern(JEL.createPattern('{{tpl0}}'), JEL.parseTree('9')).toString(), `Translator(TranslatorNode(tokens={} complex=[TemplateNode(name=undefined, template=tpl1, metaFilter=[], expression=undefined) -> TranslatorNode(tokens={} results=[LambdaResultNode(7)]),\nTemplateNode(name=undefined, template=tpl0, metaFilter=[], expression=undefined) -> TranslatorNode(tokens={} results=[LambdaResultNode(9)])]))`);
        assert.equal(translator(JEL.createPattern('{{y:tpl1::y==3}}'), JEL.parseTree('7')).addPattern(JEL.createPattern('{{c:tpl0}}'), JEL.parseTree('9')).toString(), `Translator(TranslatorNode(tokens={} complex=[TemplateNode(name=y, template=tpl1, metaFilter=[], expression=(y == 3)) -> TranslatorNode(tokens={} results=[LambdaResultNode(7)]),\nTemplateNode(name=c, template=tpl0, metaFilter=[], expression=undefined) -> TranslatorNode(tokens={} results=[LambdaResultNode(9)])]))`);
        assert.equal(translator(JEL.createPattern('{{/x/}}'), JEL.parseTree('7')).toString(), "Translator(TranslatorNode(tokens={} complex=[RegExpNode(name=undefined, regexps=/^x$/, expression=undefined) -> TranslatorNode(tokens={} results=[LambdaResultNode(7)])]))");
    });
  });

  describe('match()', function() {
    it('should match simple sentences', function() {
      const ctx = DefaultContext.get();
      const t1 = new Translator().addPattern(JEL.createPattern(`abc def`), JEL.parseTree('7'));
      assert.equal(t1.match(ctx, "abc def").length, 1);
      assert.equal(t1.match(ctx, " abc  def ").get(ctx, 0).value, 7);
      assert.equal(t1.match(ctx, "abc def def").length, 0);
      assert.equal(t1.match(ctx, "abcdef").length, 0);
      assert.equal(t1.match(ctx, "bla abc def cgd").length, 0);
      assert.equal(t1.match(ctx, "bla abc def").length, 0);
      assert.equal(t1.match(ctx, "abc gfh def").length, 0);
      
      const t2 = new Translator().addPattern(JEL.createPattern(`abc def`), JEL.parseTree('1'))
                                 .addPattern(JEL.createPattern(`abc`), JEL.parseTree('2'))
                                 .addPattern(JEL.createPattern(`xyz abc def`), JEL.parseTree('3'))
                                 .addPattern(JEL.createPattern(`xyz def abc def`), JEL.parseTree('4'));
      assert.equal(t2.match(ctx, " abc  def ").get(ctx, 0).value, 1);
      assert.equal(t2.match(ctx, " abc  ").get(ctx, 0).value, 2);
      assert.equal(t2.match(ctx, "xyz abc  def ").get(ctx, 0).value, 3);
      assert.equal(t2.match(ctx, " xyz def abc  def ").get(ctx, 0).value, 4);
      assert.equal(t2.match(ctx, " abc d def ").length, 0);
      assert.equal(t2.match(ctx, " abcdef ").length, 0);
    });

    it('should match options', function() {
      const ctx = DefaultContext.get();
      const t0 = new Translator().addPattern(JEL.createPattern(`a [a]?`), JEL.parseTree('7'));
      assert.deepEqual(t0.match(ctx, "a").elements.map(e=>e.value.value), [7]);
      assert.deepEqual(t0.match(ctx, "a a").elements.map(e=>e.value.value), [7]);
      
      const t1 = new Translator().addPattern(JEL.createPattern(`[abc|def]? x`), JEL.parseTree('7'));
      assert.deepEqual(t1.match(ctx, "abc x").elements.map(e=>e.value.value), [7]);
      assert.deepEqual(t1.match(ctx, " abc  x ").elements.map(e=>e.value.value), [7]);
      assert.deepEqual(t1.match(ctx, " def x").elements.map(e=>e.value.value), [7]);
      assert.deepEqual(t1.match(ctx, "x").elements.map(e=>e.value.value), [7]);
      assert.equal(t1.match(ctx, "abc def x").length, 0);
      assert.equal(t1.match(ctx, "abcdefx").length, 0);
      assert.equal(t1.match(ctx, "abc cgd").length, 0);
      assert.equal(t1.match(ctx, "bla x").length, 0);
      
      const t2 = new Translator().addPattern(JEL.createPattern(`abc def`), JEL.parseTree('1'))
                                 .addPattern(JEL.createPattern(`[abc]? h`), JEL.parseTree('2'))
                                 .addPattern(JEL.createPattern(`[xyz|abc] def`), JEL.parseTree('3'));
      assert.equal(t2.match(ctx, " abc  def ").get(ctx, 0).value, 1);
      assert.equal(t2.match(ctx, " abc h ").get(ctx, 0).value, 2);
      assert.equal(t2.match(ctx, "xyz   def ").get(ctx, 0).value, 3);
      assert.equal(t2.match(ctx, " xyz def abc  def ").length, 0);
      assert.equal(t2.match(ctx, " abc d def ").length, 0);
      assert.equal(t2.match(ctx, " abcdef ").length, 0);
    });

    it('should support meta', function() {
      const ctx = DefaultContext.get();
      const t1 = new Translator().addPattern(JEL.createPattern(`abc`), JEL.parseTree('2'), createMap({x: true}));
      assert.equal(t1.match(ctx, "abc").length, 1);
      assert.equal(t1.match(ctx, "abc", new Set()).length, 1);
      assert.equal(t1.match(ctx, "abc", new Set('x')).length, 1);
      assert.equal(t1.match(ctx, "abc", new Set('x')).get(ctx, 0).value, 2);
      assert.equal(t1.match(ctx, "abc", new Set('x')).get(ctx, 0).meta.get('x'), true);
      assert.equal(t1.match(ctx, "abc", new Set('y')).length, 0);
      assert.equal(t1.match(ctx, "abcd", new Set('x')).length, 0);

      
      const t2 = new Translator().addPattern(JEL.createPattern(`abc`), JEL.parseTree('1'), createMap({x: true}))
                                 .addPattern(JEL.createPattern(`abc`), JEL.parseTree('2'), createMap({y: true}))
                                 .addPattern(JEL.createPattern(`xyz`), JEL.parseTree('3'), createMap({x: true, y: true}))
                                 .addPattern(JEL.createPattern(`xyz`), JEL.parseTree('4'), createMap({x: true, z: true}));
      assert.equal(t2.match(ctx, "abc").length, 2);
      assert.equal(t2.match(ctx, "abc", new Set()).length, 2);
      assert.equal(t2.match(ctx, "abc", new Set('x')).length, 1);
      assert.equal(t2.match(ctx, "abc", new Set('y')).length, 1);
      assert.equal(t2.match(ctx, "abc", new Set('x')).get(ctx, 0).value, 1);
      assert.equal(t2.match(ctx, "abc", new Set('y')).get(ctx, 0).value, 2);
      assert.equal(t2.match(ctx, "abc", new Set(['x', 'y'])).length, 0);
      assert.equal(t2.match(ctx, "abc", new Set('y')).get(ctx, 0).meta.get('y'), true);
      assert.equal(t2.match(ctx, "abc", new Set('y')).get(ctx, 0).meta.has('x'), false);
      
      assert.equal(t2.match(ctx, "xyz", new Set('x')).length, 2);
      assert.equal(t2.match(ctx, "xyz", new Set(['x', 'y'])).length, 1);
      assert.equal(t2.match(ctx, "xyz", new Set(['x', 'y'])).get(ctx, 0).value, 3);
    });
    
    it('should support templates', function() {
        const tpl0 = exec('${`a` => 1}');
        const tpl1 = exec('${`a` => 1, x: `b` => 2, y: `b` => 12, x, y: `b` => 22}');
        const tpl2 = exec('${`a [b [c]?]?` => 3, `a b c` => 4, `d e` => 5, `f {{tpl1}}` => 6, `a [{{tpl0}}]? h` => 7}');
        const dict = new Dictionary({tpl0, tpl1, tpl2});
        const ctx = new Context(DefaultContext.get(), null, dict);

        assert.deepEqual(translator(JEL.createPattern('{{tpl0}}'), JEL.parseTree('5')).match(ctx, 'a').elements.map(e=>e.value.value), [5]);
        assert.deepEqual(translator(JEL.createPattern('{{tpl0}} {{tpl0}}'), JEL.parseTree('7')).match(ctx, 'a a').elements.map(e=>e.value.value), [7]);
        assert.deepEqual(translator(JEL.createPattern('{{tpl0}} {{tpl0}}'), JEL.parseTree('7')).match(ctx, 'b a a').elements.map(e=>e.value.value), []);
        assert.deepEqual(translator(JEL.createPattern('{{tpl0}} {{tpl0}}'), JEL.parseTree('7')).match(ctx, 'a a b').elements.map(e=>e.value.value), []);
        assert.deepEqual(translator(JEL.createPattern('{{tpl0}} {{tpl0}}'), JEL.parseTree('7')).match(ctx, 'a b').elements.map(e=>e.value.value), []);
        assert.deepEqual(translator(JEL.createPattern('a {{tpl0}} {{tpl0}} b'), JEL.parseTree('9')).match(ctx, 'a a a b').elements.map(e=>e.value.value), [9]);

        assert.deepEqual(translator(JEL.createPattern('a [{{tpl0}}]?'), JEL.parseTree('1')).match(ctx, 'a').elements.map(e=>e.value.value), [1]);
        assert.deepEqual(translator(JEL.createPattern('a [{{tpl0}}]?'), JEL.parseTree('1')).match(ctx, 'a a').elements.map(e=>e.value.value), [1]);
      
        assert.deepEqual(translator(JEL.createPattern('{{tpl1}}'), JEL.parseTree('7')).match(ctx, 'a').elements.map(e=>e.value.value), [7]);
        assert.deepEqual(translator(JEL.createPattern('{{tpl1}}'), JEL.parseTree('7')).match(ctx, 'b').elements.map(e=>e.value.value), [7, 7, 7]);

        assert.deepEqual(translator(JEL.createPattern('{{tpl1}}'), JEL.parseTree('7')).addPattern(JEL.createPattern('{{tpl0}}'), JEL.parseTree('9')).match(ctx, 'a').elements.map(e=>e.value.value), [7, 9]);
        assert.deepEqual(translator(JEL.createPattern('{{tpl0}}'), JEL.parseTree('7')).addPattern(JEL.createPattern('{{tpl1}}'), JEL.parseTree('9')).match(ctx, 'a').elements.map(e=>e.value.value), [7, 9]);
        assert.deepEqual(translator(JEL.createPattern('{{tpl0}}'), JEL.parseTree('7')).addPattern(JEL.createPattern('{{tpl1}}'), JEL.parseTree('9')).match(ctx, 'b').elements.map(e=>e.value.value), [9, 9, 9]);
        assert.deepEqual(translator(JEL.createPattern('{{tpl1}}'), JEL.parseTree('7')).addPattern(JEL.createPattern('{{tpl0}}'), JEL.parseTree('9')).match(ctx, 'b').elements.map(e=>e.value.value), [7, 7, 7]);
        assert.deepEqual(translator(JEL.createPattern('a {{tpl1}} b'), JEL.parseTree('7')).addPattern(JEL.createPattern('{{tpl0}} {{tpl0}} b'), JEL.parseTree('9')).match(ctx, 'a a b').elements.map(e=>e.value.value), [7, 9]);
        assert.deepEqual(translator(JEL.createPattern('{{tpl1}} {{tpl1}}'), JEL.parseTree('7')).addPattern(JEL.createPattern('{{tpl0}}'), JEL.parseTree('9')).match(ctx, 'a a').elements.map(e=>e.value.value), [7]);

        assert.deepEqual(translator(JEL.createPattern('{{t: tpl0 }}'), JEL.parseTree('1')).addPattern(JEL.createPattern('{{t: tpl0}}'), JEL.parseTree('2')).match(ctx, 'a').elements.map(e=>e.value.value), [1,2]);
        assert.deepEqual(translator(JEL.createPattern('{{t: tpl0 :: t == 2}}'), JEL.parseTree('1')).addPattern(JEL.createPattern('{{t: tpl0 :: t == 1}}'), JEL.parseTree('2')).match(ctx, 'a').elements.map(e=>e.value.value), [2]);

        assert.deepEqual(translator(JEL.createPattern('{{t: tpl1 }} {{u: tpl0 :: t == 1}}'), JEL.parseTree('t')).addPattern(JEL.createPattern('{{t: tpl0}}'), JEL.parseTree('0')).match(ctx, 'a a').elements.map(e=>e.value.value), [1]);
        assert.deepEqual(translator(JEL.createPattern('{{t: tpl1 }} {{u: tpl0 :: t == 2}}'), JEL.parseTree('t')).addPattern(JEL.createPattern('{{t: tpl0}}'), JEL.parseTree('0')).match(ctx, 'b a').elements.map(e=>e.value.value), [2]);
        assert.deepEqual(translator(JEL.createPattern('{{t: tpl1 }} {{u: tpl0 :: t == 1}}'), JEL.parseTree('t')).addPattern(JEL.createPattern('{{t: tpl0}}'), JEL.parseTree('0')).match(ctx, 'a').elements.map(e=>e.value.value), [0]);
      
        const t0 = translator(JEL.createPattern('{{t: tpl2}}'), JEL.parseTree('t'));
        assert.deepEqual(t0.match(ctx, 'a').elements.map(e=>e.value.value), [3]);
        assert.deepEqual(t0.match(ctx, 'a b c').elements.map(e=>e.value.value), [3, 4]);
        assert.deepEqual(t0.match(ctx, 'd e').elements.map(e=>e.value.value), [5]);
        assert.deepEqual(t0.match(ctx, 'f a').elements.map(e=>e.value.value), [6]);
        assert.deepEqual(t0.match(ctx, 'a h').elements.map(e=>e.value.value), [7]);
        assert.deepEqual(t0.match(ctx, 'a a h').elements.map(e=>e.value.value), [7]);
    });
    
    it('should support regexp templates', function() {
        const ctx = DefaultContext.get();

        assert.deepEqual(translator(JEL.createPattern('{{/a+bc/}}'), JEL.parseTree('5')).match(ctx, 'aaabc').elements.map(e=>e.value.value), [5]);
        assert.deepEqual(translator(JEL.createPattern('{{m: /abc/}}'), JEL.parseTree('m')).match(ctx, 'abc').elements.map(e=>e.value.value), ['abc']);
        assert.deepEqual(translator(JEL.createPattern('{{m: /(a)(b)(c)/}}'), JEL.parseTree('m[1]')).match(ctx, 'abc').elements.map(e=>e.value.value), ['b']);
        assert.deepEqual(translator(JEL.createPattern('{{m: /e+/ /f+/}}'), JEL.parseTree('m[0] + m[1]')).match(ctx, 'eee fff').elements.map(e=>e.value.value), ['eeefff']);
        assert.deepEqual(translator(JEL.createPattern('{{m: /a+/ :: m != "aaa"}}'), JEL.parseTree('m')).match(ctx, 'aa').elements.map(e=>e.value.value), ["aa"]);
        assert.deepEqual(translator(JEL.createPattern('{{m: /a+/ :: m != "aaa"}}'), JEL.parseTree('m')).match(ctx, 'aaa').elements.map(e=>e.value.value), []);
    });
    
    it('should parse real sentences', function() {
        const animals = exec('${small: `dog` => "dog", small: `cat` => "cat", big: `cow` => "cow"}');
        const animalSounds = exec('${`woof` => "dog", `meow` => "cat", `moo` => "cow"}');
        const verbs = exec('${`walks` => "walks", `sleeps` => "sleeps", `says` => "says"}');
        const dict = new Dictionary({animals, animalSounds, verbs});
        const ctx = new Context(DefaultContext.get(), null, dict);

        const sounds = translator(JEL.createPattern('the {{animals}} says {{animalSounds}}'), JEL.parseTree('true'));
        assert.deepEqual(sounds.match(ctx, "the dog says woof").elements.map(e=>e.value.state), [1]);
        assert.deepEqual(sounds.match(ctx, "the cat says meow").elements.map(e=>e.value.state), [1]);
        assert.deepEqual(sounds.match(ctx, "the fish says meow").elements.map(e=>e.value.value), []);
        assert.deepEqual(sounds.match(ctx, "the woof says dog").elements.map(e=>e.value.value), []);
        assert.deepEqual(sounds.match(ctx, "dog says meow").elements.map(e=>e.value.value), []);
        assert.deepEqual(sounds.match(ctx, "the cat says meow or something like that").elements.map(e=>e.value.value), []);

        const soundsValidating = translator(JEL.createPattern('the {{a: animals}} says {{s: animalSounds :: s == a}}'), JEL.parseTree('a'));
        assert.deepEqual(soundsValidating.match(ctx, "the dog says woof").elements.map(e=>e.value.value), ["dog"]);
        assert.deepEqual(soundsValidating.match(ctx, "the cat says meow").elements.map(e=>e.value.value), ["cat"]);
        assert.deepEqual(soundsValidating.match(ctx, "the dog says meow").elements.map(e=>e.value.value), []);

        const soundsMeta = translator(JEL.createPattern('the {{a: animals.small}} says {{s: animalSounds :: s == a}}'), JEL.parseTree('true'));
        assert.deepEqual(soundsMeta.match(ctx, "the dog says woof").elements.map(e=>e.value.state), [1]);
        assert.deepEqual(soundsMeta.match(ctx, "the cow says woof").elements.map(e=>e.value.value), []);
        assert.deepEqual(soundsMeta.match(ctx, "the cow says moo").elements.map(e=>e.value.value), []);
      
        const soundsVerb = translator(JEL.createPattern('the {{animals}} {{verbs}} [{{animalSounds}}]?'), JEL.parseTree('1'))
          .addPattern(JEL.createPattern('the {{animals.small}} says {{animalSounds}}'), JEL.parseTree('2'));
        assert.deepEqual(soundsVerb.match(ctx, "the dog says woof").elements.map(e=>e.value.value), [1, 2]);
        assert.deepEqual(soundsVerb.match(ctx, "the dog says moo").elements.map(e=>e.value.value), [1, 2]);
        assert.deepEqual(soundsVerb.match(ctx, "the cow says moo").elements.map(e=>e.value.value), [1]);
        assert.deepEqual(soundsVerb.match(ctx, "the dog sleeps").elements.map(e=>e.value.value), [1]);
        assert.deepEqual(soundsVerb.match(ctx, "the cow sleeps").elements.map(e=>e.value.value), [1]);
        assert.deepEqual(soundsVerb.match(ctx, "and now something completely different").elements.map(e=>e.value.value), []);
    });

    it('should support promises as result', function() {
        const t = translator(JEL.createPattern('the cat says meow'), JEL.parseTree('JelPromise.resolve(1)'))
                .addPattern(JEL.createPattern('the dog barks [woof|meow]?'), JEL.parseTree('JelPromise(5)'));

      return Promise.all([
          t.match(promiseCtx, "the cat says meow").then(r=>assert.deepEqual(r.elements.map(e=>e.value.value), [1])),
          t.match(promiseCtx, "the dog barks").then(r=>assert.deepEqual(r.elements.map(e=>e.value.value), [5])),
          t.match(promiseCtx, "the dog barks meow").then(r=>assert.deepEqual(r.elements.map(e=>e.value.value), [5]))
        ]);
    });

    
    it('should support promises in templates', function() {
        const animals = JEL.parseTree('${small: `dog` => JelPromise("dog"), small: `cat` => JelPromise.resolve("cat"), big: `cow` => "cow"}').execute(promiseCtx);
        const dict = new Dictionary({animals});
        const ctx = new Context(promiseCtx, null, dict);

        const t = translator(JEL.createPattern('the {{animals}} barks'), JEL.parseTree('JelPromise.resolve(1)'))
           .addPattern(JEL.createPattern('the {{a: animals}} says [woof|meow|moo]?'), JEL.parseTree('a'))
           .addPattern(JEL.createPattern('the {{a: animals :: a!="dog"}} says meow'), JEL.parseTree('a+"boo"'))

        assert.deepEqual(t.match(ctx, "the cow says moo").elements.map(e=>e.value.value), ["cow"]);
        assert.deepEqual(t.match(ctx, "the cow says meow").elements.map(e=>e.value.value), ["cow", "cowboo"]);
        
        return Promise.all([
          t.match(ctx, "the dog barks").then(r=>assert.deepEqual(r.elements.map(e=>e.value.value), [1])),
          t.match(ctx, "the cat barks").then(r=>assert.deepEqual(r.elements.map(e=>e.value.value), [1])),
          t.match(ctx, "the cow barks").then(r=>assert.deepEqual(r.elements.map(e=>e.value.value), [1])),
          t.match(ctx, "the dog says woof").then(r=>assert.deepEqual(r.elements.map(e=>e.value.value), ["dog"])),
          t.match(ctx, "the cat says meow").then(r=>assert.deepEqual(r.elements.map(e=>e.value.value), ["cat", "catboo"])),
          t.match(ctx, "the dog says meow").then(r=>assert.deepEqual(r.elements.map(e=>e.value.value), ["dog"]))
        ]);
    });


  });
  
});

