import JelObject from '../JelObject';
import ApproximateNumber from './ApproximateNumber';
import UnitValue from './UnitValue';
import Fraction from './Fraction';
import Numeric from './Numeric';

import Context from '../Context';
import TypeChecker from './TypeChecker';


// This class is used to specify property values when there can be more than one value, especially for categories. It can either define min/max/typical values, or a complete matrix that defines how often which value occurs.
export default class DistributionPoint extends JelObject {
	/**
	 * Creates a new data point for the given value and the given share. The share is a value between 0 and 1 that defines the share of instances whose value is smaller or equal the value. 
	 * The smallest existing value should use 0, and the existing possible value should use 1. 
	 * @param value the value (e.g. measurement) 
	 * @param share the relative number of instances that have the given value or lower, given as a value from 0 to 1. 
	 */
  constructor(public value: Numeric, public share: number) {
    super('DistributionPoint');
  }
	
	getSerializationProperties(): any[] {
		return [this.value, this.share];
	}

  
  static create_jel_mapping = {value: 1, share: 2};
	static create(ctx: Context, ...args: any[]): DistributionPoint {
		return new DistributionPoint(TypeChecker.numeric(args[0], 'value'), TypeChecker.realNumber(args[1], 'share'));
	}
}

