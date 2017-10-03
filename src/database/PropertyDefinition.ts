

export default class PropertyDefinition {
  
  // Each property 
  // 'fixed' means that the value is always fixed at a given time/reality. If not, the property uses PropertyValueDistribution
  constructor(public distinctName: string, public baseType: any, public fixed = true) {
  }
  
  
  
}

