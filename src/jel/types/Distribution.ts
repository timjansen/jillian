import Util from '../../util/Util';
import JelObject from '../JelObject';
import Runtime from '../Runtime';
import Context from '../Context';
import List from './List';
import DistributionPoint from './DistributionPoint';
import ApproximateNumber from './ApproximateNumber';
import FuzzyBoolean from './FuzzyBoolean';
import UnitValue from './UnitValue';
import JelNumber from './JelNumber';
import Fraction from './Fraction';

const INVERSE_OP = {'<': '>', '<=': '>=', '>': '<', '>=': '<='};

/** 
 * This class is used to specify property values when there can be more than one value, especially for categories. 
 * It can either define min/max/typical values, or handle a large number of data points and interpolate between them.
 */
export default class Distribution extends JelObject {
	public points: DistributionPoint[];
	
	JEL_PROPERTIES: Object;

	
  constructor(distributionPoints?: List, public average?: UnitValue|ApproximateNumber|Fraction|JelNumber,
							 min?: UnitValue|ApproximateNumber|Fraction|JelNumber, max?: UnitValue|ApproximateNumber|Fraction|JelNumber, 
							 mean?: UnitValue|ApproximateNumber|Fraction|JelNumber) {
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
	add(ctx: Context, distributionPoints?: List, average?: UnitValue|ApproximateNumber|Fraction|JelNumber,
							 min?: UnitValue|ApproximateNumber|Fraction|JelNumber, max?: UnitValue|ApproximateNumber|Fraction|JelNumber, 
							 mean?: UnitValue|ApproximateNumber|Fraction|JelNumber): Distribution {
		
		const np = new Map<number, DistributionPoint>(this.points.map(p=>[p.share, p] as any));
		if (distributionPoints)
			distributionPoints.elements.forEach(p=>np.set(p.share, p));
		if (min != null)
			np.set(0, new DistributionPoint(min, 0));
		if (max != null)
			np.set(1, new DistributionPoint(max, 1));
		if (mean != null)
			np.set(0.5, new DistributionPoint(mean, 0.5));
		
		return new Distribution(new List(np.values()), average != null ? average : this.average);
	}
	
	mean_jel_mapping: Object;
	mean(ctx: Context): UnitValue|ApproximateNumber|Fraction|JelNumber {
		return this.getValue(ctx, 0.5);
	}

	max_jel_mapping: Object;
	max(ctx: Context): UnitValue|ApproximateNumber|Fraction|JelNumber {
		return this.getValue(ctx, 1);
	}

	min_jel_mapping: Object;
	min(ctx: Context): UnitValue|ApproximateNumber|Fraction|JelNumber {
		return this.getValue(ctx, 0);
	}

	getValue_jel_mapping: Object;
	getValue(ctx: Context, share: JelNumber|Fraction|number): UnitValue|ApproximateNumber|Fraction|JelNumber {
		const share0 = Math.max(0, Math.min(1, JelNumber.toRealNumber(share)));
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
		return Runtime.op(ctx, '+', Runtime.op(ctx, '/', Runtime.op(ctx, '*', Runtime.op(ctx, '-', rp.value, lp.value), Runtime.op(ctx, '-', share0, JelNumber.valueOf(lp.share))), Runtime.op(ctx, '-', JelNumber.valueOf(rp.share), JelNumber.valueOf(lp.share))), lp.value);
	}

	getShare_jel_mapping: Object;
	getShare(ctx: Context, value: UnitValue|ApproximateNumber|Fraction|JelNumber): Promise<JelNumber>|JelNumber|null {
		if (this.points.length == 1) 
			return Util.resolveValues((avg: FuzzyBoolean, p0: FuzzyBoolean)=>avg.toRealBoolean() ? 0.5 : p0.toRealBoolean() ? 1 : null, Runtime.op(ctx, '==', this.average, value), Runtime.op(ctx, '==', this.points[0].value, value)); 
		
		return Util.resolveValues((lt: FuzzyBoolean, gt: FuzzyBoolean)=>{
			if (lt.toRealBoolean() || gt.toRealBoolean())
				return null;
			
			let bestShare: JelNumber|undefined = undefined;
			let ri: number | undefined = undefined;

			return Util.processPromiseList(this.points, r=>Runtime.op(ctx, '==', r.value, value), (p, r)=>{
				if (p.toRealBoolean()) 
					bestShare = r.share;
			}, ()=>{
				if (bestShare != undefined)
					return bestShare;
				
				return Util.processPromiseList(this.points, r=>Runtime.op(ctx, '>', r.value, value), (p, r, rstep)=>{
					if (p.toRealBoolean() && ri == undefined)
						ri = rstep;
				}, ()=>{
					
					ri = ri == undefined ? this.points.length-1 : ri;
					let li = ri - 1;
					if (li < 0) {
						li++;
						ri++;
					}

					const lp: DistributionPoint = this.points[li], rp: DistributionPoint = this.points[ri];
					// linear interpolation
					// P       = x * (rp-lp) + lp
					// P.value = x * (rp.value-lp.value) + lp.value
					// P.share = x * (rp.share-lp.share) + lp.share
					// x = (P.value-lp.value)/(rp.value-lp.value)
					// P.share = (P.value-lp.value)*(rp.share-lp.share)/(rp.value-lp.value)  + lp.share

					return JelNumber.toNumberWithPromise(Runtime.opWithPromises(ctx, '+', Runtime.opWithPromises(ctx, '/', Runtime.opWithPromises(ctx, '*', Runtime.opWithPromises(ctx, '-', value, lp.value), Runtime.op(ctx, '-', rp.share, lp.share)), Runtime.opWithPromises(ctx, '-', rp.value, lp.value)),  lp.share));
				});
			});
		}, Runtime.op(ctx, '<', value, this.min(ctx)), Runtime.op(ctx, '>', value, this.max(ctx)));
	}
	
	op(ctx: Context, operator: string, right: JelObject|null): JelObject|null|Promise<JelObject|null> {
		if (right instanceof Distribution) {
			switch (operator) {
				case '==': 
				case '===':
					return Util.resolveValues((eq: FuzzyBoolean)=>{
						if (!eq.toRealBoolean())
							return FuzzyBoolean.FALSE;
						if (this.points.length != right.points.length)
							return FuzzyBoolean.FALSE;
						for (let i = 0; i < this.points.length; i++)
							if (JelNumber.toNumber(this.points[i].value) != JelNumber.toNumber(right.points[i].value) || this.points[i].share !=right.points[i].share)
								return FuzzyBoolean.FALSE;
						return FuzzyBoolean.TRUE;
					}, Runtime.op(ctx, '===', this.average, right.average));
				case '>>':
				case '>>=':
					return Runtime.op(ctx, operator, this.min(ctx), right.max(ctx));
				case '<<':
				case '<<=':
					return Runtime.op(ctx, operator, this.max(ctx), right.min(ctx));

				case '>':
				case '>=':
					return Util.resolveValues((op: FuzzyBoolean, inOp: FuzzyBoolean)=> {
						if (op.toRealBoolean())
							return FuzzyBoolean.TRUE;
						if (inOp.toRealBoolean())
							return FuzzyBoolean.FALSE;
						return Util.resolveValue(Runtime.op(ctx, operator, this.mean(ctx), right.mean(ctx)), (meanCmp: FuzzyBoolean)=>FuzzyBoolean.create(ctx, (meanCmp.state-0.5)/2+0.5));
					}, Runtime.op(ctx, operator, this.min(ctx), right.max(ctx)), Runtime.op(ctx, INVERSE_OP[operator], this.min(ctx), right.max(ctx)));
					
				case '<':
				case '<=':
					return Util.resolveValues((op: FuzzyBoolean, inOp: FuzzyBoolean)=> {
						if (op.toRealBoolean())
							return FuzzyBoolean.TRUE;
						if (inOp.toRealBoolean())
							return FuzzyBoolean.FALSE;
						return Util.resolveValue(Runtime.op(ctx, operator, this.mean(ctx), right.mean(ctx)), (meanCmp: FuzzyBoolean)=>FuzzyBoolean.create(ctx, (meanCmp.state-0.5)/2+0.5));
					}, Runtime.op(ctx, operator, this.max(ctx), right.min(ctx)), Runtime.op(ctx, INVERSE_OP[operator], this.max(ctx), right.min(ctx)));
			}
		}
		else if (right instanceof JelNumber || right instanceof Fraction || right instanceof ApproximateNumber || right instanceof UnitValue) {
			switch (operator) {
				case '==': 
					return Runtime.op(ctx, '>=', right, this.min(ctx)).falsestWithPromises(Runtime.op(ctx, '<=', right, this.max(ctx)));

				case '===':
					return Runtime.op(ctx, '===', right, this.min(ctx)).falsestWithPromises(Runtime.op(ctx, '===', right, this.max(ctx)));

				case '>>':
				case '>':
					return Runtime.op(ctx, operator, this.min(ctx), right);
				case '>=':
					return Runtime.op(ctx, operator, this.max(ctx), right);

				case '<':
				case '<<':
					return Runtime.op(ctx, operator, this.max(ctx), right);
				case '<<=':
					return Runtime.op(ctx, operator, this.min(ctx), right);
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
