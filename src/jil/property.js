

class Property {

  // Property has either a type, or fields (name->type)
  // 'fixed' means that the value is always fixed at a given time/reality. If not, the property uses PropertyValueDistribution
  constructor(distinctName, type, fields = {}, fixed = true) {
    this.distinctName = distinctName;
    this.type = type;
    this.fields = fields;
  }
  
  
  
}

