'use strict';

const assert = require('assert');
const JEL = require('../../src/jel/jel.js');
const jelAssert = require('./jel-assert.js');

const JelType = require('../../src/jel/type.js');
const JelNode = require('../../src/jel/node.js');
const Literal = require('../../src/jel/nodes/literal.js');
const Variable = require('../../src/jel/nodes/variable.js');
const Operator = require('../../src/jel/nodes/operator.js');
const List = require('../../src/jel/nodes/list.js');
const Reference = require('../../src/jel/nodes/reference.js');
const Condition = require('../../src/jel/nodes/condition.js');
const Assignment = require('../../src/jel/nodes/assignment.js');
const With = require('../../src/jel/nodes/with.js');
const Lambda = require('../../src/jel/nodes/lambda.js');
const Call = require('../../src/jel/nodes/call.js');

describe('jelExecute', function() {
  describe('parseExpression()', function() {
    
    it('should execute a simple literal', function() {
      assert.equal(new JEL('5').execute(), 5);
      assert.equal(new JEL('+5').execute(), 5);
      assert.equal(new JEL('-5').execute(), -5);
      assert.equal(new JEL('- 5').execute(), -5);
      assert.equal(new JEL('"foo"').execute(), 'foo');
      assert.equal(new JEL('true').execute(), true);
      assert.equal(new JEL('null').execute(), null);
    });

   it('should execute primitive operations', function() {
      assert.equal(new JEL('5+5').execute(), 10);
      assert.equal(new JEL('5*5').execute(), 25);
      assert.equal(new JEL('7-5').execute(), 2);
      assert.equal(new JEL('!true').execute(), false);
      assert.equal(new JEL('-(10/2)').execute(), -5);
      assert.equal(new JEL('"foo"+"bar"').execute(), "foobar");
      assert.equal(new JEL('5>5').execute(), false);
      assert.equal(new JEL('5<5').execute(), false);
      assert.equal(new JEL('5==5').execute(), true);
    });

   it('should access variables', function() {
      assert.equal(new JEL('a').execute({a: 10}), 10);
      assert.equal(new JEL('a+b').execute({a: 1, b: 3}), 4);
    });
    
    
   it('support conditions', function() {
      assert.equal(new JEL('if true then 1 else 2').execute(), 1);
      assert.equal(new JEL('if false then 1 else 2').execute(), 2);
      assert.equal(new JEL('if 8 then 1 else 2').execute(), 1);
      assert.equal(new JEL('if 0 then 1 else 2').execute(), 2);
      assert.equal(new JEL('if "j" then 1 else 2').execute(), 1);
      assert.equal(new JEL('if "" then 1 else 2').execute(), 2);
      assert.equal(new JEL("if 2>1 then 'foo' else 'bar'").execute(), "foo");
      assert.equal(new JEL("if 2<1 then 'foo' else 'bar'").execute(), "bar");
      assert.equal(new JEL("if 2<1 then 'foo' else if 3>2 then 2 else 1").execute(), 2);
      assert.equal(new JEL("if 2>1 then (if 3<2 then 2 else 1) else 6").execute(), 1);
    });

    

  });
});

