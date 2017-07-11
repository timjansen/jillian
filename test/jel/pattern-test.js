'use strict';

const assert = require('assert');
const JEL = require('../../src/jel/jel.js');
const Pattern = require('../../src/jel/pattern.js');
const Context = require('../../src/jel/context.js');
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


describe('jelPatterns', function() {
  describe('parse()', function() {
    
    it('should parse an empty string', function() {
      assert.equal(JEL.createPattern('').tree, null);
      assert.equal(JEL.createPattern('   ').tree, null);
    });

    it('should parse simple patterns', function() {
      assert.deepEqual(JEL.createPattern('a b c').tree, sme('a', sme('b', sme('c'))));
      assert.deepEqual(JEL.createPattern(' foo bar mi:3 double-dash ').tree, sme('foo', sme('bar', sme('mi:3', sme('double-dash')))));
    });

    it('should parse optional patterns', function() {
      const y = sme('y');
      assert.equal(JEL.createPattern('[x]? y').tree.toString(), on(sme('x', y), y).toString());

      const e = on(sme('e'));
      const cd = on(sme('c', sme('d', e)), e);
      const b = sme('b', cd);
      const a = on(sme('a', b), b);
      assert.equal(JEL.createPattern('[a]? b [c d]? [e]?').tree.toString(), a.toString());
    });

    it('should parse multi-patterns', function() {
      assert.equal(JEL.createPattern('[x]').tree.toString(), mon(sme('x')).toString());
      assert.equal(JEL.createPattern('[x|y z]').tree.toString(), mon(sme('x'), sme('y', sme('z'))).toString());
      
      const a = sme('a');
      assert.equal(JEL.createPattern('[x|y|z] a').tree.toString(), mon(sme('x', a), sme('y', a), sme('z', a)).toString());
    });

    it('should parse optional multi-patterns', function() {
      assert.equal(JEL.createPattern('[x|y z]?').tree.toString(), oon(undefined, sme('x'), sme('y', sme('z'))).toString());
      
      const a = sme('a');
      assert.equal(JEL.createPattern('[x|y|z]? a').tree.toString(), oon(a, sme('x', a), sme('y', a), sme('z', a)).toString());
    });

    it('should parse templates', function() {
      assert.equal(JEL.createPattern('a {{test: tpl.x.y :: test > 0}} c').tree.toString(), sme('a', new TemplateNode('tpl', 'test', ['x','y'], 'test > 0', sme('c'))).toString());
      
    });

    
  });
  
  describe('match()', function() {
    const ctx = new Context();
    
    it('should match an empty string', function() {
      assert(JEL.createPattern('').match(ctx, ''));
      assert(JEL.createPattern('').match(ctx, '   '));
      assert(JEL.createPattern('').match(ctx, []));
      assert(!JEL.createPattern('').match(ctx, 'a'));
    });

    it('should parse simple patterns', function() {
      assert(JEL.createPattern('a b c').match(ctx, ['a', 'b', 'c']));
      assert(JEL.createPattern('a b c').match(ctx, 'a b c'));
      assert(JEL.createPattern('a b c').match(ctx, '  a b c  '));
      assert(!JEL.createPattern('a b c').match(ctx, 'a b d'));
      assert(!JEL.createPattern('a b c').match(ctx, 'd b c'));
      assert(!JEL.createPattern('a b c').match(ctx, ['a', 'b', 'd']));
    });

    it('should parse optional patterns', function() {
      assert(JEL.createPattern('[x]? y').match(ctx, 'x y'));
      assert(JEL.createPattern('[x]? y').match(ctx, 'y'));
      assert(!JEL.createPattern('[x]? y').match(ctx, 'x'));
      assert(JEL.createPattern('[a]? b [c d]? [e]?').match(ctx, 'a b c d e'));
      assert(JEL.createPattern('[a]? b [c d]? [e]?').match(ctx, ' b '));
      assert(JEL.createPattern('[a]? b [c d]? [e]?').match(ctx, 'a b c d'));
      assert(JEL.createPattern('[a]? b [c d]? [e]?').match(ctx, 'b c d'));
      assert(!JEL.createPattern('[a]? b [c d]? [e]?').match(ctx, 'c d'));
      assert(!JEL.createPattern('[a]? b [c d]? [e]?').match(ctx, 'a b c e'));
      assert(!JEL.createPattern('[a]? b [c d]? [e]?').match(ctx, 'a b c'));
      assert(!JEL.createPattern('[a]? b [c d]? [e]?').match(ctx, ''));
      assert(!JEL.createPattern('[a]? b [c d]? [e]?').match(ctx, 'x a b c d e'));
      assert(!JEL.createPattern('[a]? b [c d]? [e]?').match(ctx, ' a b c d e f'));
      assert(!JEL.createPattern('[a]? b [c d]? [e]?').match(ctx, ' b d c'));
      assert(!JEL.createPattern('[a]? b [c d]? [e]?').match(ctx, ' b x'));
    });

    it('should parse multi-patterns', function() {
      assert(JEL.createPattern('[x]').match(ctx, 'x'));
      assert(!JEL.createPattern('[x]').match(ctx, 'y'));
      
      assert(JEL.createPattern('[x|y z]').match(ctx, 'x'));
      assert(JEL.createPattern('[x|y z]').match(ctx, 'y z'));
      assert(!JEL.createPattern('[x|y z]').match(ctx, 'x y z'));
      assert(!JEL.createPattern('[x|y z]').match(ctx, ''));
      
      assert(JEL.createPattern('[x|y|z] a').match(ctx, 'x a'));
      assert(JEL.createPattern('[x|y|z] a').match(ctx, 'z a'));
      assert(!JEL.createPattern('[x|y|z] a').match(ctx, 'z'));
      assert(!JEL.createPattern('[x|y|z] a').match(ctx, 'z a h'));
      assert(!JEL.createPattern('[x|y|z] a').match(ctx, 'h y a'));
      assert(!JEL.createPattern('[x|y|z] a').match(ctx, 'a a'));
    });

    it('should parse optional multi-patterns', function() {
      assert(JEL.createPattern('[x|y z]?').match(ctx, ''));
      assert(JEL.createPattern('[x|y z]?').match(ctx, 'x'));
      assert(JEL.createPattern('[x|y z]?').match(ctx, 'y z'));
      assert(!JEL.createPattern('[x|y z]?').match(ctx, 'x y z'));
  
      assert(JEL.createPattern('[x|y|z]? a').match(ctx, 'y a'));
      assert(JEL.createPattern('[x|y|z]? a').match(ctx, 'a'));
      assert(!JEL.createPattern('[x|y|z]? a').match(ctx, 'x'));
      assert(!JEL.createPattern('[x|y|z]? a').match(ctx, 'y a k'));
    });

    it('should parse templates', function() {
//      assert(JEL.createPattern('a {{test: tpl.x.y :: test > 0}} c').match(ctx, ''));
    });
    
  });
  
});

