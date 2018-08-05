import JelType from '../JelType';
import List from './List';
import DistributionPoint from './DistributionPoint';
import ApproximateNumber from './ApproximateNumber';
import FuzzyBoolean from './FuzzyBoolean';
import UnitValue from './UnitValue';
import Fraction from './Fraction';

const INVERSE_OP = {'<': '>', '<=': '>=', '>': '<', '>=': '<='};

/** 
 * This class is used to specify property values when there can be more than one value, especially for categories. 
 * It can either define min/max/typical values, or handle a large number of data points and interpolate between them.
 */
export default class Distribution extends JelType {
	public points: DistributionPoint[];
	
	JEL_PROPERTIES: Object;

	
  constructor(distributionPoints?: List, public average?: UnitValue|ApproximateNumber|Fraction|number,
							 min?: UnitValue|ApproximateNumber|Fraction|number, max?: UnitValue|ApproximateNumber|Fraction|number, 
							 mean?: UnitValue|ApproximateNumber|Fraction|number) {
    super();
		
		this.points = distributionPoints != null ? distributionPoints.elements.slice() : [];

		if (min != null)
			this.points.push(new DistributionPoint(min, 0));
		if (mean != null)
			this.points.push(new DistributionPoint(mean, 0.5));
		if (max != null)
			this.points.push(new DistributionPoint(max, 1));

		if (!this.points.length)
			throw new Error("Can not create distribution without any points");
		
		this.points.sort((a: DistributionPoint, b: DistributionPoint)=> a.share-b.share);
  }
	
	add_jel_mapping: Object;
	add(distributionPoints?: List, average?: UnitValue|ApproximateNumber|Fraction|number,
							 min?: UnitValue|ApproximateNumber|Fraction|number, max?: UnitValue|ApproximateNumber|Fraction|number, 
							 mean?: UnitValue|ApproximateNumber|Fraction|number): Distribution {
		
		const np = new Map<number, DistributionPoint>(this.points.map(p=>[JelType.toNumber(p.share), p] as any));
		if (distributionPoints)
			distributionPoints.elements.forEach(p=>np.set(JelType.toNumber(p.share), p));
		if (min != null)
			np.set(0, new DistributionPoint(min, 0));
		if (max != null)
			np.set(1, new DistributionPoint(max, 1));
		if (mean != null)
			np.set(0.5, new DistributionPoint(mean, 0.5));
		
		return new Distribution(new List(np.values()), average != null ? average : this.average);
	}
	
	mean_jel_mapping: Object;
	mean(): UnitValue|ApproximateNumber|Fraction|number {
		return this.getValue(0.5);
	}

	max_jel_mapping: Object;
	max(): UnitValue|ApproximateNumber|Fraction|number {
		return this.getValue(1);
	}

	min_jel_mapping: Object;
	min(): UnitValue|ApproximateNumber|Fraction|number {
		return this.getValue(0);
	}

	getValue_jel_mapping: Object;
	getValue(share: number|Fraction): UnitValue|ApproximateNumber|Fraction|number {
		const share0 = Math.max(0, Math.min(1, JelType.toNumber(share)));
		let ri = 0;
		for (let r of this.points) {
			if (r.share == share0)
				return r.value;
			if (r.share > share0 || ri == this.points.length-1)
				break;
			ri++;
		}
		let li = ri - 1;
		if (li < 0) {
			if (this.points.length == 1)
				return this.average != null ? this.average : this.points[0].value;
			li++;
			ri++;
		}
	
		const lp: DistributionPoint = this.points[li], rp: DistributionPoint = this.points[ri];

		// P       = x * (rp-lp) + lp
		// P.value = x * (rp.value-lp.value) + lp.value
		// P.share = x * (rp.share-lp.share) + lp.share
		// x = (P.share-lp.share) / (rp.share-lp.share) 
		// P.value = (rp.value-lp.value) * (P.share - lp.share) / (rp.share-lp.share) + lp.value
		return JelType.op('+', JelType.op('/', JelType.op('*', JelType.op('-', rp.value, lp.value), share0 - lp.share), rp.share-lp.share), lp.value);
	}

	getShare_jel_mapping: Object;
	getShare(value: UnitValue|ApproximateNumber|Fraction|number): number|null {
		if (this.points.length == 1) {
			if (JelType.op('==', this.average, value).toRealBoolean())
				return 0.5;
			if (JelType.op('==', this.points[0].value, value).toRealBoolean())
				return 1;
			return null;
		}
		if (JelType.op('<', value, this.min()).toRealBoolean() || JelType.op('>', value, this.max()).toRealBoolean())
			return null;

		let ri = 0;
		for (let r of this.points) {
			if (JelType.op('==', r.value, value).toRealBoolean())
				return r.share;
			if (JelType.op('>', r.value, value).toRealBoolean() || ri == this.points.length-1)
				break;
			ri++;
		}
		let li = ri - 1;
		if (li < 0) {
			li++;
			ri++;
		}
		
		const lp: DistributionPoint = this.points[li], rp: DistributionPoint = this.points[ri];
		
		// P       = x * (rp-lp) + lp
		// P.value = x * (rp.value-lp.value) + lp.value
		// P.share = x * (rp.share-lp.share) + lp.share
		// x = (P.value-lp.value)/(rp.value-lp.value)
		// P.share = (P.value-lp.value)*(rp.share-lp.share)/(rp.value-lp.value)  + lp.share
		
		return JelType.toNumber(JelType.op('/', JelType.op('*', JelType.op('-', value, lp.value), rp.share - lp.share), JelType.op('-', rp.value, lp.value))) + lp.share;
	}
	
	op(operator: string, right: any): any {
		if (right instanceof Distribution) {
			switch (operator) {
				case '==': 
				case '===':
					if (!JelType.op('===', this.average, right.average).toRealBoolean())
						return FuzzyBoolean.FALSE;
					if (this.points.length != right.points.length)
						return FuzzyBoolean.FALSE;
					for (let i = 0; i < this.points.length; i++)
						if (JelType.toNumber(this.points[i].value) != JelType.toNumber(right.points[i].value) || this.points[i].share !=right.points[i].share)
							return FuzzyBoolean.FALSE;
					return FuzzyBoolean.TRUE;

				case '>>':
				case '>>=':
					return JelType.op(operator, this.min(), right.max());
				case '<<':
				case '<<=':
					return JelType.op(operator, this.max(), right.min());

				case '>':
				case '>=':
					if (JelType.op(operator, this.min(), right.max()).toRealBoolean())
						return FuzzyBoolean.TRUE;
					if (JelType.op(INVERSE_OP[operator], this.min(), right.max()).toRealBoolean())
						return FuzzyBoolean.FALSE;
					return FuzzyBoolean.create((JelType.op(operator, this.mean(), right.mean()).state-0.5)/2+0.5);
					
				case '<':
				case '<=':
					if (JelType.op(operator, this.max(), right.min()).toRealBoolean())
						return FuzzyBoolean.TRUE;
					if (JelType.op(INVERSE_OP[operator], this.max(), right.min()).toRealBoolean())
						return FuzzyBoolean.FALSE;
					return FuzzyBoolean.create((JelType.op(operator, this.mean(), right.mean()).state-0.5)/2+0.5);
			}
		}
		else if (typeof right == 'number' || right instanceof Fraction || right instanceof ApproximateNumber || right instanceof UnitValue) {
			switch (operator) {
				case '==': 
					return JelType.op('>=', right, this.min()).falsest(JelType.op('<=', right, this.max()));

				case '===':
					return JelType.op('===', right, this.min()).falsest(JelType.op('===', right, this.max()));

				case '>>':
				case '>':
					return JelType.op(operator, this.min(), right);
				case '>=':
					return JelType.op(operator, this.max(), right);

				case '<':
				case '<<':
					return JelType.op(operator, this.max(), right);
				case '<<=':
					return JelType.op(operator, this.min(), right);
			}		
		}
		return super.op(operator, right);
	}
	
	getSerializationProperties(): any[] {
		return [this.points, this.average];
	}

	static create_jel_mapping = {distributionPoints: 0, average: 1, min: 2, max: 3, mean: 4 };
	static create(...args: any[]): Distribution {
		return new Distribution(args[0], args[1], args[2], args[3], args[4]);
	}  
}


Distribution.prototype.JEL_PROPERTIES = {average: 1, points: 1};
Distribution.prototype.mean_jel_mapping = {};
Distribution.prototype.min_jel_mapping = {};
Distribution.prototype.max_jel_mapping = {};
Distribution.prototype.getValue_jel_mapping = {share: 0};
Distribution.prototype.getShare_jel_mapping = {value: 0};
Distribution.prototype.add_jel_mapping = {distributionPoints: 0, average: 1, min: 2, max: 3, mean: 4 };
