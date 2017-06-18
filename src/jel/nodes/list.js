'use strict';

const JelNode = require('../node.js');
const JelList = require('../list.js');

class List extends JelNode {
  constructor(elements) {
    super();
    this.elements = elements;
  }
  
  execute(ctx) { 
    const list = this.elements.map(e=>e.execute(ctx));
    if (list.findIndex(a=>a instanceof Promise) < 0)
      return new JelList(list);
     else
      return Promise.all(list).then(resolved=>new JelList(resolved));
  }
  
  getSerializationProperties() {
    return {elements: this.elements};
  }
}

module.exports = List;