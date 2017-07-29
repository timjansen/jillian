'use strict';

const assert = require('assert');
const JEL = require('../../src/jel/jel.js');
const Pattern = require('../../src/jel/pattern.js');
const Context = require('../../src/jel/context.js');
const MultiNode = require('../../src/translation/nodes/multinode.js');
const StaticResultNode = require('../../src/translation/nodes/staticresultnode.js');
const TemplateNode = require('../../src/translation/nodes/templatenode.js');

const MTRUE = new MultiNode().makeOptional(StaticResultNode.TRUE);

function mnt(token, next=MTRUE) {
  return new MultiNode().addTokenMatch(token, next);
}

function mntOpt(token, next=MTRUE) {
  return new MultiNode().addTokenMatch(token, undefined).makeOptional(next);
}


describe('jelPatterns', function() {
  describe('parse()', function() {
    
    it('should parse an empty string', function() {
      assert.equal(JEL.createPattern('').tree.toString(), MTRUE);
      assert.equal(JEL.createPattern('   ').tree.toString(), MTRUE);
    });

    it('should parse simple patterns', function() {
      assert.equal(JEL.createPattern('a b c').tree.toString(), mnt('a', mnt('b', mnt('c'))).toString());
      assert.equal(JEL.createPattern(' foo bar mi:3 double-dash ').tree.toString(), mnt('foo', mnt('bar', mnt('mi:3', mnt('double-dash')))).toString());
    });

    it('should parse optional patterns', function() {
      assert.equal(JEL.createPattern('[x]?').tree.toString(), mntOpt('x').toString());
      
      const y = mnt('y');
      assert.equal(JEL.createPattern('[x]? y').tree.toString(), mntOpt('x', y).toString());

      const e = mntOpt('e');
      const cd = mnt('c', mnt('d', null)).makeOptional(e);
      const b = mnt('b', cd);
      const a = mntOpt('a', b);
      assert.equal(JEL.createPattern('[a]? b [c d]? [e]?').tree.toString(), a.toString());
    });
    it('should parse multi-patterns', function() {
      assert.equal(JEL.createPattern('[x]').tree.toString(), mnt('x').toString());
      assert.equal(JEL.createPattern('[x|y z]').tree.toString(), mnt('x').addTokenMatch('y', mnt('z')).toString());
      
      const a = mnt('a');
      assert.equal(JEL.createPattern('[x|y|z] a').tree.toString(), mnt('x', a).addTokenMatch('y', a).addTokenMatch('z', a).toString());
    });


    it('should parse optional multi-patterns', function() {
      assert.equal(JEL.createPattern('[x|y z]?').tree.toString(), mnt('x', null).addTokenMatch('y', mnt('z', null)).makeOptional(MTRUE).toString());
      
      const a = mnt('a');
      assert.equal(JEL.createPattern('[x|y|z]? a').tree.toString(), mnt('x', null).addTokenMatch('y', null).addTokenMatch('z', null).makeOptional(a).toString());
    });

    it('should parse templates', function() {
      assert.equal(JEL.createPattern('a {{test: tpl.x.y :: test > 0}} c').tree.toString(), mnt('a', new MultiNode().addTemplateMatch(new TemplateNode('tpl', 'test', ['x','y'], 'test > 0', mnt('c')))).toString());
      
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
      assert(!JEL.createPattern('a b c').match(ctx, 'a b c d'));
      assert(!JEL.createPattern('a b c').match(ctx, ['a', 'b', 'd']));
    });

    it('should parse optional patterns', function() {
      assert(JEL.createPattern('[x]?').match(ctx, 'x'));
      assert(JEL.createPattern('[x]?').match(ctx, []));
      assert(JEL.createPattern('[x]?').match(ctx, ''));
      assert(!JEL.createPattern('[x]?').match(ctx, 'y'));
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
      assert(JEL.createPattern('foo [x|y|z] a b').match(ctx, 'foo z a b'));
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

