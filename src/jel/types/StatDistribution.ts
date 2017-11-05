import JelType from '../JelType';

// This class is used to specify property values when there can be more than one value, especially for categories. It can either define min/max/typical values, or a complete matrix that defines how often which value occurs.
export default class ValueDistribution extends JelType {

  constructor(extremeMin: any, extremeMax: any, average: any, typicalMin: any, typicalMax: any, distribution: any) {
    super();
  }
  
  
  
}

