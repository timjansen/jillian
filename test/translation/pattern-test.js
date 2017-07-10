'use strict';

const assert = require('assert');
const Pattern = require('../../src/translation/pattern.js');
const SingleMatchNode = require('../../src/translation/nodes/singlematchnode.js');
const OptionalNode = require('../../src/translation/nodes/optionalnode.js');
const MultiOptionsNode = require('../../src/translation/nodes/multioptionsnode.js');
const OptionalOptionsNode = require('../../src/translation/nodes/optionaloptionsnode.js');
const TemplateNode = require('../../src/translation/nodes/templatenode.js');

function sme(a, next) {
  return new SingleMatchNode(a, next);
}

function on(a, next) {
  return new OptionalNode(a, next);
}

function mon(...a) {
  return new MultiOptionsNode(a);
}

function oon(next, ...a) {
  return new OptionalOptionsNode(a, next);
}


describe('Pattern', function() {
  describe('parse()', function() {
    
    it('should parse an empty string', function() {
      assert.equal(new Pattern('').tree, null);
      assert.equal(new Pattern('   ').tree, null);
    });

    it('should parse simple patterns', function() {
      assert.deepEqual(new Pattern('a b c').tree, sme('a', sme('b', sme('c'))));
      assert.deepEqual(new Pattern(' foo bar mi:3 double-dash ').tree, sme('foo', sme('bar', sme('mi:3', sme('double-dash')))));
    });

    it('should parse optional patterns', function() {
      const y = sme('y');
      assert.equal(new Pattern('[x]? y').tree.toString(), on(sme('x', y), y).toString());

      const e = on(sme('e'));
      const cd = on(sme('c', sme('d', e)), e);
      const b = sme('b', cd);
      const a = on(sme('a', b), b);
      assert.equal(new Pattern('[a]? b [c d]? [e]?').tree.toString(), a.toString());
    });

    it('should parse multi-patterns', function() {
      assert.equal(new Pattern('[x]').tree.toString(), mon(sme('x')).toString());
      assert.equal(new Pattern('[x|y z]').tree.toString(), mon(sme('x'), sme('y', sme('z'))).toString());
      
      const a = sme('a');
      assert.equal(new Pattern('[x|y|z] a').tree.toString(), mon(sme('x', a), sme('y', a), sme('z', a)).toString());
    });

    it('should parse optional multi-patterns', function() {
      assert.equal(new Pattern('[x|y z]?').tree.toString(), oon(undefined, sme('x'), sme('y', sme('z'))).toString());
      
      const a = sme('a');
      assert.equal(new Pattern('[x|y|z]? a').tree.toString(), oon(a, sme('x', a), sme('y', a), sme('z', a)).toString());
    });

    it('should parse templates', function() {
      assert.equal(new Pattern('a {{test: tpl.x.y :: test > 0}} c').tree.toString(), sme('a', new TemplateNode('tpl', 'test', ['x','y'], 'test > 0', sme('c'))).toString());
      
    });

    
  });
});

