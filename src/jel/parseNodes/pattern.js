'use strict';

const JelNode = require('./node.js');

class Pattern extends JelNode {
  constructor(pattern) {
    super();
    this.pattern = pattern;
  }
  
  // override
  execute(ctx) {
    return this.pattern;
  }
  
  
  // overrride
  equals(other) {
		return other instanceof Pattern &&
      this.pattern == other.pattern;
	}
  
	toString() {
		return Pattern.toString(this.pattern);	
	}
	
	static toString(p) {
		return '`' + p.patternText.replace(/`/g, '\\`').replace(/\n/g, '\\n') + '`';	
	}
	
	
  getSerializationProperties() {
    return {pattern: this.pattern};
  }
}

module.exports = Pattern;