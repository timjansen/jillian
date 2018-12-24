'use strict';

require('source-map-support').install();
const assert = require('assert');
const s = require('../../build/jel/Serializer.js').default;
const Dictionary = require('../../build/jel/types/Dictionary.js').default;
const Pattern = require('../../build/jel/types/Pattern.js').default;
const DefaultContext = require('../../build/jel/DefaultContext.js').default;
const JEL = require('../../build/jel/JEL.js').default;

DefaultContext.get(); // force init

describe('jelSerializer', function() {
  describe('serialize()', function() {
    
    it('should serialize primitives', function() {
      assert.equal(s.serialize(0), '0');
      assert.equal(s.serialize(1), '1');
      assert.equal(s.serialize(-1), '-1');
      assert.equal(s.serialize(12.508), '12.508');
      assert.equal(s.serialize(true), 'true');
      assert.equal(s.serialize(false), 'false');
      assert.equal(s.serialize("foo"), '"foo"');
      assert.equal(s.serialize('foo"bar"'), '"foo\\"bar\\""');
      assert.equal(s.serialize(null), 'null');
      assert.equal(s.serialize(undefined), 'null');
    });
    
    it('should serialize arrays', function() {
      assert.equal(s.serialize([]), '[]');
      assert.equal(s.serialize([1]), '[1]');
      assert.equal(s.serialize([null]), '[null]');
      assert.equal(s.serialize([1, 2, 3]), '[1,2,3]');
      assert.equal(s.serialize([[[[]]]]), '[[[[]]]]');
      assert.equal(s.serialize([1, [3, null, 5], "foo", [4, [5]]]), '[1,[3,null,5],"foo",[4,[5]]]');
    });
    
    it('should serialize array-like lists', function() {
      assert.equal(s.serialize({length: 0}), '[]');
      assert.equal(s.serialize({length: 3, 0: 'foo', 2: 'bar', 3: 'nevermind'}), '["foo",null,"bar"]');
    });
    
    
    it('should serialize anonymous objects using an error message', function() {
      assert.equal(s.serialize({x: 0}), '"unserializable object. type=Object"');
    });
    
    it('should use getSerializationProperties() for objects, with argument names', function() {
      assert.equal(s.serialize({x: 0, getSerializationProperties() {return {};} }), 'Object()');
      assert.equal(s.serialize({x: 0, getSerializationProperties() {return {c: 4, b: 2, a: 9};} }), 'Object(a=9,b=2,c=4)');
      
      class ABC { constructor(obj) {this.a = 2; this.obj = obj; } getSerializationProperties() { return {x: 2, y: 'bla', zzz: [1, 2, 3], obj: this.obj}; }}
      
      assert.equal(s.serialize(new ABC()), 'ABC(x=2,y="bla",zzz=[1,2,3])');
      assert.equal(s.serialize(new ABC(new ABC('bar'))), 'ABC(obj=ABC(obj="bar",x=2,y="bla",zzz=[1,2,3]),x=2,y="bla",zzz=[1,2,3])');
    });

    it('should use getSerializationProperties() for objects, with argument arrays', function() {
      assert.equal(s.serialize({x: 0, getSerializationProperties() {return [];} }), 'Object()');
      assert.equal(s.serialize({x: 0, getSerializationProperties() {return [9, 2, 4];} }), 'Object(9,2,4)');
      
      class ABC { getSerializationProperties() { return [2, 'bla', [1, 2, 3]]; }}    
      assert.equal(s.serialize(new ABC()), 'ABC(2,"bla",[1,2,3])');
      assert.equal(s.serialize(new ABC(), true), 'ABC(2, "bla", [1, 2, 3])');
    });

    
    it('should not serialize null values for objects', function() {
      assert.equal(s.serialize({x: 0, getSerializationProperties() {return {c: null, b: 2, a: null};} }), 'Object(b=2)');
    });
    
    it('should serialize dictionaries', function() {
      assert.equal(s.serialize(new Dictionary()), '{}');
      assert.equal(s.serialize(new Dictionary({a:3, b: 'e'})), '{a:3,b:"e"}');
      assert.equal(s.serialize(new Dictionary({"@e": "3"})), '{"@e":"3"}');
    });
    
    it('should serialize patterns', function() {
      assert.equal(s.serialize(new Pattern(null, 'ab c\nd')), '`ab c\nd`');
    });

		it('should serialize Lambda expressions', function() {
      assert.equal(s.serialize(new JEL("a=>a+1").executeImmediately()), 'a=>(a + 1)');
      assert.equal(s.serialize(new JEL("(a, b,  c )=>let d=a+b: a.b(c , if a==1 then d else a, @Ref)").executeImmediately()), '(a, b, c)=>let d=(a + b): a.b(c, if (a == 1) then d else a, @Ref)');
    });

    
    it('should pretty print', function() {
      assert.equal(s.serialize([1, 2, 3], true), '[1, 2, 3]');
      assert.equal(s.serialize({x: 0, getSerializationProperties() {return {y: 4};} }, true), 'Object(\n  y=4\n)');
      assert.equal(s.serialize({x: 0, getSerializationProperties() {return [1, 2, 3];} }, true), 'Object(1, 2, 3)');
      
      class ABC { constructor(obj) {this.a = 2; this.obj = obj; } getSerializationProperties() { return {x: 2, y: 'bla', zzz: [1, 2, 3], obj: this.obj}; }}
      
      assert.equal(s.serialize(new ABC(), true), 'ABC(\n  x=2,\n  y="bla",\n  zzz=[1, 2, 3]\n)');
      assert.equal(s.serialize(new ABC(new ABC('bar')), true), 'ABC(\n  obj=ABC(\n      obj="bar",\n      x=2,\n      y="bla",\n      zzz=[1, 2, 3]\n    ),\n  x=2,\n  y="bla",\n  zzz=[1, 2, 3]\n)');
    });

    
  });
});

