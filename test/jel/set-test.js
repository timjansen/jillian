'use strict';

require('source-map-support').install();
const assert = require('assert');
const Context = require('../../build/jel/Context.js').default;
const DefaultContext = require('../../build/jel/DefaultContext.js').default;
const JEL = require('../../build/jel/JEL.js').default;
const {plus, JelAssert, JelPromise, JelConsole} = require('../jel-assert.js');
const jelAssert = new JelAssert();

describe('Set', function() {
  let defaultContext, ctx;
  before(function(){
    return DefaultContext.get().then(dc=> {
      defaultContext = dc;
      return plus(dc).then(c=> {
        ctx = c;
        jelAssert.setCtx(ctx);
      });    
    });
  });
  
  describe('Creation', function() {
    it('creates Sets from Lists', function() {
        jelAssert.equal('Set([]).values', '{}'); 
        jelAssert.equal('Set(["a", "b", "c"]).values', '{a: true, b: true, c: true}'); 
        jelAssert.equal('Set(["a", "b", "a", "c", "c", "a", "c"]).values', '{a: true, b: true, c: true}'); 
    });
    it('creates Sets from dictionaries', function() {
        jelAssert.equal('Set({a: true, b: true, c: 1}).values', '{a: true, b: true, c: 1}'); 
        jelAssert.equal('Set({}).values', '{}'); 
    });
    it('creates Sets from varargs', function() {
        jelAssert.equal('Set.of("a", "b", "c").values', '{a: true, b: true, c: true}'); 
        jelAssert.equal('Set.of("a", "b", "c", "a", "b").values', '{a: true, b: true, c: true}'); 
    });
    it('returns Set.empty', function() {
        jelAssert.equal('Set.empty.values', '{}'); 
    });
  });

  describe('has properties', function() {
    it('has isEmpty', function() {
        jelAssert.equal('Set([]).isEmpty', 'true'); 
        jelAssert.equal('Set(["a", "b", "c"]).isEmpty', 'false'); 
    });
    it('has size', function() {
        jelAssert.equal('Set([]).size', '0'); 
        jelAssert.equal('Set(["a", "b", "c"]).size', '3'); 
    });
  });
  
  describe('has operators', function() {
    it('has +', function() {
        jelAssert.equal('Set.of("1", "2", "3") + Set.of("3", "4", "5")', 'Set(Set.of("1", "2", "3", "4", "5").values)'); 
        jelAssert.equal('Set.of("a", "b", "c") + "d"', 'Set(Set.of("a", "b", "c", "d").values)'); 
    });
    it('has -', function() {
        jelAssert.equal('Set.of("1", "2", "3") - Set.of("3", "4", "5")', 'Set(Set.of("1", "2").values)'); 
    });
  });
  
  describe('has methods', function() {
    it('has toList()', function() {
        jelAssert.equal('Set([]).toList()', '[]'); 
        jelAssert.equal('Set(["c"]).toList()', '["c"]'); 
    });

    it('has has()', function() {
        jelAssert.equal('Set.of("foo", "bar").has("bar")', 'true'); 
        jelAssert.equal('Set.of("foo", "bar").has("nope")', 'false');

        jelAssert.equal('Set.of("foo", "bar").has(Set.of("bar", "foo"))', 'true'); 
        jelAssert.equal('Set.of("foo", "bar").has(Set.of("bar", "foo", "woo"))', 'false'); 
        jelAssert.equal('Set.of("foo", "bar", "woo").has(Set.of("bar", "foo"))', 'true'); 
        jelAssert.equal('Set.of("foo", "bar", "blip").has(Set.of("bar", "foo", "woo"))', 'false');

        jelAssert.equal('Set.of("foo", "bar").has(["bar", "foo"])', 'true'); 
        jelAssert.equal('Set.of("foo", "bar").has(["bar", "foo", "woo"])', 'false'); 
        jelAssert.equal('Set.of("foo", "bar", "woo").has(["bar", "foo"])', 'true'); 
        jelAssert.equal('Set.of("foo", "bar", "blip").has(["bar", "foo", "woo"])', 'false');
    });
    
    it('has add()', function() {
        jelAssert.equal('Set.of("foo", "bar").add("extra").has("extra")', 'true'); 
        jelAssert.equal('Set.of("foo", "bar").add("extra").has("foo")', 'true'); 
    });

    it('has addAll()', function() {
        jelAssert.equal('Set.of("foo", "bar").addAll(["extra"]).has("extra")', 'true'); 
        jelAssert.equal('Set.of("foo", "bar").addAll(["extra", "super"]).has("extra")', 'true'); 
        jelAssert.equal('Set.of("foo", "bar").addAll(["extra", "super"]).has("super")', 'true'); 
        jelAssert.equal('Set.of("foo", "bar").addAll(["extra", "super"]).values.keys.sort()', '["bar", "extra", "foo", "super"]'); 
        jelAssert.equal('Set.of("foo", "bar").addAll(["extra", "super"]).has("nope")', 'false');
        jelAssert.equal('Set.of("foo", "bar").addAll(["extra", "super", "foo", "super"]).size', '4'); 

        jelAssert.equal('Set.of("foo", "bar").addAll(Set.of("extra")).has("extra")', 'true'); 
        jelAssert.equal('Set.of("foo", "bar").addAll(Set.of("extra", "super")).has("extra")', 'true'); 
        jelAssert.equal('Set.of("foo", "bar").addAll(Set.of("extra", "super")).values.keys.sort()', '["bar", "extra", "foo", "super"]'); 
        jelAssert.equal('Set.of("foo", "bar").addAll(Set.of("extra", "super")).has("bar")', 'true'); 
        jelAssert.equal('Set.of("foo", "bar").addAll(Set.of("extra", "foo", "super")).values.keys.sort()', '["bar", "extra", "foo", "super"]'); 
    });

    it('has delete()', function() {
        jelAssert.equal('Set.of("foo", "bar").delete("extra").has("extra")', 'false'); 
        jelAssert.equal('Set.of("foo", "bar").delete("extra").size', '2'); 
        jelAssert.equal('Set.of("foo", "bar").delete("bar").has("bar")', 'false'); 
        jelAssert.equal('Set.of("foo", "bar").delete("bar").values.keys', '["foo"]'); 
    });

    it('has deleteAll()', function() {
        jelAssert.equal('Set.of("foo", "bar").deleteAll(Set(["extra"])).has("extra")', 'false'); 
        jelAssert.equal('Set.of("foo", "bar").deleteAll(Set(["x", "y", "foo", "extra"])).values.keys', '["bar"]'); 

        jelAssert.equal('Set.of("foo", "bar").deleteAll(Dictionary.empty).size', '2'); 
        jelAssert.equal('Set.of("foo", "bar").deleteAll(Set(["extra"])).has("extra")', 'false'); 
        jelAssert.equal('Set.of("foo", "bar").deleteAll(Set(["x", "y", "foo", "extra"])).values.keys', '["bar"]'); 

        jelAssert.equal('Set.of("foo", "bar").deleteAll(Set.empty).values.keys.sort()', '["bar", "foo"]'); 
        jelAssert.equal('Set.of("foo", "bar").deleteAll({extra: false}).size', '2'); 
        jelAssert.equal('Set.of("foo", "bar").deleteAll({foo: 1, bla: 2}).values.keys', '["bar"]'); 
    });

    it('has map()', function() {
        jelAssert.equal('Set.of("foo", "bar").map(s=>"_"+s+"!!").values.keys.sort()', '["_bar!!", "_foo!!"]'); 
        jelAssert.equal('Set.of("foo", "bar", "bla", "blup", "meow").map(s=>if s.startsWith("b") then null else s+"!").values.keys.sort()', '["foo!", "meow!"]'); 
    });
    
    it('has mapToList()', function() {
        jelAssert.equal('Set.of("foo", "bar").mapToList(s=>"_"+s+"!!").sort()', '["_bar!!", "_foo!!"]'); 
        jelAssert.equal('Set.of("foo", "bar", "bla", "blup", "meow").mapToList(s=>if s.startsWith("b") then null else s+"!").sort()', '["foo!", "meow!", null, null, null]'); 
    });
    
    it('has mapToDictionary()', function() {
        jelAssert.equal('Set.of("foo", "bar").mapToDictionary(s=>s+"!")', '{foo: "foo!", bar: "bar!"}'); 
    });
    
    it('has filter()', function() {
        jelAssert.equal('Set.of("foo", "bar", "bla", "blup", "meow").filter(s=>!s.startsWith("b")).toList().sort()', '["foo", "meow"]'); 
    });

    it('has reduce()', function() {
        jelAssert.equal('Set.of("foooooo", "bar", "bla", "blup", "meow").reduce((a, s)=>s.length+a, 0)', '21'); 
    });

    it('has hasAny()', function() {
        jelAssert.equal('Set.of("foo", "bar", "bla", "blup", "meow").hasAny(s=>s.contains("o"))', 'true'); 
        jelAssert.equal('Set.of("foo", "bar", "bla", "blup", "meow").hasAny(s=>s.contains("y"))', 'false'); 
    });

    it('has hasOnly()', function() {
        jelAssert.equal('Set.of("foo", "bar", "bla", "blup", "meow").hasOnly(s=>s.contains("o") || s.contains("b"))', 'true'); 
        jelAssert.equal('Set.of("foo", "bar", "bla", "blup", "meow").hasOnly(s=>s.contains("o"))', 'false'); 
    });

    
  });
  

});
