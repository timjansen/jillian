'use strict';

class PropertyDefinition {

  // Each property 
  // 'fixed' means that the value is always fixed at a given time/reality. If not, the property uses PropertyValueDistribution
  constructor(distinctName, baseType, fixed = true) {
    this.distinctName = distinctName;
    this.baseType = baseType;
  }
  
  
  
}


module.exports = PropertyDefinition;

