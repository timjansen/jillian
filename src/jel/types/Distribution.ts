import JelType from '../JelType';
import Context from '../Context';
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
	add(ctx: Context, distributionPoints?: List, average?: UnitValue|ApproximateNumber|Fraction|number,
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
	mean(ctx: Context): UnitValue|ApproximateNumber|Fraction|number {
		return this.getValue(ctx, 0.5);
	}

	max_jel_mapping: Object;
	max(ctx: Context): UnitValue|ApproximateNumber|Fraction|number {
		return this.getValue(ctx, 1);
	}

	min_jel_mapping: Object;
	min(ctx: Context): UnitValue|ApproximateNumber|Fraction|number {
		return this.getValue(ctx, 0);
	}

	getValue_jel_mapping: Object;
	getValue(ctx: Context, share: number|Fraction): UnitValue|ApproximateNumber|Fraction|number {
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
		return JelType.op(ctx, '+', JelType.op(ctx, '/', JelType.op(ctx, '*', JelType.op(ctx, '-', rp.value, lp.value), share0 - lp.share), rp.share-lp.share), lp.value);
	}

	getShare_jel_mapping: Object;
	getShare(ctx: Context, value: UnitValue|ApproximateNumber|Fraction|number): number|null {
		if (this.points.length == 1) {
			if (JelType.op(ctx, '==', this.average, value).toRealBoolean())
				return 0.5;
			if (JelType.op(ctx, '==', this.points[0].value, value).toRealBoolean())
				return 1;
			return null;
		}
		if (JelType.op(ctx, '<', value, this.min(ctx)).toRealBoolean() || JelType.op(ctx, '>', value, this.max(ctx)).toRealBoolean())
			return null;

		let ri = 0;
		for (let r of this.points) {
			if (JelType.op(ctx, '==', r.value, value).toRealBoolean())
				return r.share;
			if (JelType.op(ctx, '>', r.value, value).toRealBoolean() || ri == this.points.length-1)
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
		
		return JelType.toNumber(JelType.op(ctx, '/', JelType.op(ctx, '*', JelType.op(ctx, '-', value, lp.value), rp.share - lp.share), JelType.op(ctx, '-', rp.value, lp.value))) + lp.share;
	}
	
	op(ctx: Context, operator: string, right: any): any {
		if (right instanceof Distribution) {
			switch (operator) {
				case '==': 
				case '===':
					if (!JelType.op(ctx, '===', this.average, right.average).toRealBoolean())
						return FuzzyBoolean.FALSE;
					if (this.points.length != right.points.length)
						return FuzzyBoolean.FALSE;
					for (let i = 0; i < this.points.length; i++)
						if (JelType.toNumber(this.points[i].value) != JelType.toNumber(right.points[i].value) || this.points[i].share !=right.points[i].share)
							return FuzzyBoolean.FALSE;
					return FuzzyBoolean.TRUE;

				case '>>':
				case '>>=':
					return JelType.op(ctx, operator, this.min(ctx), right.max(ctx));
				case '<<':
				case '<<=':
					return JelType.op(ctx, operator, this.max(ctx), right.min(ctx));

				case '>':
				case '>=':
					if (JelType.op(ctx, operator, this.min(ctx), right.max(ctx)).toRealBoolean())
						return FuzzyBoolean.TRUE;
					if (JelType.op(ctx, INVERSE_OP[operator], this.min(ctx), right.max(ctx)).toRealBoolean())
						return FuzzyBoolean.FALSE;
					return FuzzyBoolean.create(ctx, (JelType.op(ctx, operator, this.mean(ctx), right.mean(ctx)).state-0.5)/2+0.5);
					
				case '<':
				case '<=':
					if (JelType.op(ctx, operator, this.max(ctx), right.min(ctx)).toRealBoolean())
						return FuzzyBoolean.TRUE;
					if (JelType.op(ctx, INVERSE_OP[operator], this.max(ctx), right.min(ctx)).toRealBoolean())
						return FuzzyBoolean.FALSE;
					return FuzzyBoolean.create(ctx, (JelType.op(ctx, operator, this.mean(ctx), right.mean(ctx)).state-0.5)/2+0.5);
			}
		}
		else if (typeof right == 'number' || right instanceof Fraction || right instanceof ApproximateNumber || right instanceof UnitValue) {
			switch (operator) {
				case '==': 
					return JelType.op(ctx, '>=', right, this.min(ctx)).falsest(JelType.op(ctx, '<=', right, this.max(ctx)));

				case '===':
					return JelType.op(ctx, '===', right, this.min(ctx)).falsest(JelType.op(ctx, '===', right, this.max(ctx)));

				case '>>':
				case '>':
					return JelType.op(ctx, operator, this.min(ctx), right);
				case '>=':
					return JelType.op(ctx, operator, this.max(ctx), right);

				case '<':
				case '<<':
					return JelType.op(ctx, operator, this.max(ctx), right);
				case '<<=':
					return JelType.op(ctx, operator, this.min(ctx), right);
			}		
		}
		return super.op(ctx, operator, right);
	}
	
	getSerializationProperties(): any[] {
		return [this.points, this.average];
	}

	static create_jel_mapping = {distributionPoints: 1, average: 2, min: 3, max: 4, mean: 5};
	static create(ctx: Context, ...args: any[]): Distribution {
		return new Distribution(args[0], args[1], args[2], args[3], args[4]);
	}  
}


Distribution.prototype.JEL_PROPERTIES = {average: 1, points: 1};
Distribution.prototype.mean_jel_mapping = {};
Distribution.prototype.min_jel_mapping = {};
Distribution.prototype.max_jel_mapping = {};
Distribution.prototype.getValue_jel_mapping = {share: 1};
Distribution.prototype.getShare_jel_mapping = {value: 1};
Distribution.prototype.add_jel_mapping = {distributionPoints: 1, average: 2, min: 3, max: 4, mean: 5 };
