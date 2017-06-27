'use strict';

const assert = require('assert');
const s = require('../../src/jel/serializer.js');

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
      assert.equal(s.serialize({x: 0}), '"unsupported object"');
    });
    
    it('should use getSerializationProperties() for objects', function() {
      assert.equal(s.serialize({x: 0, getSerializationProperties() {return {};} }), 'Object()');
      assert.equal(s.serialize({x: 0, getSerializationProperties() {return {c: 4, b: 2, a: 9};} }), 'Object(a=9,b=2,c=4)');
      
      class ABC { constructor(obj) {this.a = 2; this.obj = obj; } getSerializationProperties() { return {x: 2, y: 'bla', zzz: [1, 2, 3], obj: this.obj}; }}
      
      assert.equal(s.serialize(new ABC()), 'ABC(obj=null,x=2,y="bla",zzz=[1,2,3])');
      assert.equal(s.serialize(new ABC(new ABC('bar'))), 'ABC(obj=ABC(obj="bar",x=2,y="bla",zzz=[1,2,3]),x=2,y="bla",zzz=[1,2,3])');
    });

    it('should pretty print', function() {
      assert.equal(s.serialize([1, 2, 3], true), '[1, 2, 3]');
      assert.equal(s.serialize({x: 0, getSerializationProperties() {return {y: 4};} }, true), 'Object(\n  y=4\n)');
      
      class ABC { constructor(obj) {this.a = 2; this.obj = obj; } getSerializationProperties() { return {x: 2, y: 'bla', zzz: [1, 2, 3], obj: this.obj}; }}
      
      assert.equal(s.serialize(new ABC(), true), 'ABC(\n  obj=null,\n  x=2,\n  y="bla",\n  zzz=[1, 2, 3]\n)');
      assert.equal(s.serialize(new ABC(new ABC('bar')), true), 'ABC(\n  obj=ABC(\n      obj="bar",\n      x=2,\n      y="bla",\n      zzz=[1, 2, 3]\n    ),\n  x=2,\n  y="bla",\n  zzz=[1, 2, 3]\n)');
    });

    
  });
});

