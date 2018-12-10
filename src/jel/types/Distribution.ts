import Util from '../../util/Util';
import JelObject from '../JelObject';
import Runtime from '../Runtime';
import Context from '../Context';
import List from './List';
import DistributionPoint from './DistributionPoint';
import ApproximateNumber from './ApproximateNumber';
import Numeric from './Numeric';
import JelBoolean from './JelBoolean';
import UnitValue from './UnitValue';
import Float from './Float';
import Fraction from './Fraction';
import TypeChecker from './TypeChecker';

const INVERSE_OP = {'<': '>', '<=': '>=', '>': '<', '>=': '<='};

/** 
 * This class is used to specify property values when there can be more than one value, especially for categories. 
 * It can either define min/max/typical values, or handle a large number of data points and interpolate between them.
 */
export default class Distribution extends JelObject {
	public points: DistributionPoint[];
	
	JEL_PROPERTIES: Object;

	
  constructor(distributionPoints: List|null, public average: Numeric|null, min: Numeric|null, max: Numeric|null, mean: Numeric|null) {
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
	add(ctx: Context, distributionPoints?: List, average?: Numeric, min?: Numeric, max?: Numeric, mean?: Numeric): Distribution {
		
		const np = new Map<number, DistributionPoint>(this.points.map(p=>[p.share, p] as any));
		if (distributionPoints)
			distributionPoints.elements.forEach(p=>np.set(p.share, p));
		if (min != null)
			np.set(0, new DistributionPoint(min, 0));
		if (max != null)
			np.set(1, new DistributionPoint(max, 1));
		if (mean != null)
			np.set(0.5, new DistributionPoint(mean, 0.5));
		
		return new Distribution(new List(np.values()), average != null ? average : this.average, null, null, null);
	}
	
	mean_jel_mapping: Object;
	mean(ctx: Context): Numeric {
		return this.getValue(ctx, 0.5);
	}

	max_jel_mapping: Object;
	max(ctx: Context): Numeric {
		return this.getValue(ctx, 1);
	}

	min_jel_mapping: Object;
	min(ctx: Context): Numeric {
		return this.getValue(ctx, 0);
	}

	getValue_jel_mapping: Object;
	getValue(ctx: Context, share: any): Numeric {
		const share0 = Math.max(0, Math.min(1, TypeChecker.realNumber(share, 'share')));
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
		const rpShare = Float.valueOf(rp.share), lpShare = Float.valueOf(lp.share);
		return Runtime.op(ctx, '+', Runtime.op(ctx, '/', Runtime.op(ctx, '*', Runtime.op(ctx, '-', rp.value, lp.value) as any, Runtime.op(ctx, '-', Float.valueOf(share0), lpShare) as any) as any, Runtime.op(ctx, '-', rpShare, lpShare) as any) as any, lp.value) as any;
	}

	getShare_jel_mapping: Object;
	getShare(ctx: Context, value0: any): Promise<Float>|Float|null {
		const value = TypeChecker.numeric(value0, 'value');
		if (this.points.length == 1) 
			return Util.resolveValues((avg: JelBoolean, p0: JelBoolean)=>avg.toRealBoolean() ? 0.5 : p0.toRealBoolean() ? 1 : null, Runtime.op(ctx, '==', this.average, value), Runtime.op(ctx, '==', this.points[0].value, value)); 
		
		return Util.resolveValues((lt: JelBoolean, gt: JelBoolean)=>{
			if (lt.toRealBoolean() || gt.toRealBoolean())
				return null;
			
			let bestShare: Float|undefined = undefined;
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

					const lpShare = Float.valueOf(lp.share), rpShare = Float.valueOf(rp.share);
					return Float.toFloatWithPromise(Runtime.opWithPromises(ctx, '+', Runtime.opWithPromises(ctx, '/', Runtime.opWithPromises(ctx, '*', Runtime.opWithPromises(ctx, '-', value as any, lp.value as any), Runtime.op(ctx, '-', rpShare, lpShare)), Runtime.opWithPromises(ctx, '-', rp.value as any, lp.value as any)),  lpShare));
				});
			});
		}, Runtime.op(ctx, '<', value, this.min(ctx)), Runtime.op(ctx, '>', value, this.max(ctx)));
	}
	
	op(ctx: Context, operator: string, right: JelObject): JelObject|Promise<JelObject> {
		if (right instanceof Distribution) {
			switch (operator) {
				case '==': 
				case '===':
					return Util.resolveValues((eq: JelBoolean)=>{
						if (!eq.toRealBoolean())
							return JelBoolean.FALSE;
						if (this.points.length != right.points.length)
							return JelBoolean.FALSE;
						for (let i = 0; i < this.points.length; i++)
							if (Float.toFloat(this.points[i].value) != Float.toFloat(right.points[i].value) || this.points[i].share !=right.points[i].share)
								return JelBoolean.FALSE;
						return JelBoolean.TRUE;
					}, Runtime.op(ctx, '===', this.average, right.average));
				case '>>':
				case '>>=':
					return Runtime.op(ctx, operator, this.min(ctx), right.max(ctx));
				case '<<':
				case '<<=':
					return Runtime.op(ctx, operator, this.max(ctx), right.min(ctx));

				case '>':
				case '>=':
					return Util.resolveValues((op: JelBoolean, inOp: JelBoolean)=> {
						if (op.toRealBoolean())
							return JelBoolean.TRUE;
						if (inOp.toRealBoolean())
							return JelBoolean.FALSE;
						return Util.resolveValue(Runtime.op(ctx, operator, this.mean(ctx), right.mean(ctx)), (meanCmp: JelBoolean)=>JelBoolean.create(ctx, (meanCmp.state-0.5)/2+0.5));
					}, Runtime.op(ctx, operator, this.min(ctx), right.max(ctx)), Runtime.op(ctx, INVERSE_OP[operator], this.min(ctx), right.max(ctx)));
					
				case '<':
				case '<=':
					return Util.resolveValues((op: JelBoolean, inOp: JelBoolean)=> {
						if (op.toRealBoolean())
							return JelBoolean.TRUE;
						if (inOp.toRealBoolean())
							return JelBoolean.FALSE;
						return Util.resolveValue(Runtime.op(ctx, operator, this.mean(ctx), right.mean(ctx)), (meanCmp: JelBoolean)=>JelBoolean.create(ctx, (meanCmp.state-0.5)/2+0.5));
					}, Runtime.op(ctx, operator, this.max(ctx), right.min(ctx)), Runtime.op(ctx, INVERSE_OP[operator], this.max(ctx), right.min(ctx)));
			}
		}
		else if (right instanceof Float || right instanceof Fraction || right instanceof ApproximateNumber || right instanceof UnitValue) {
			switch (operator) {
				case '==': 
					return JelBoolean.falsestWithPromises(ctx, Runtime.op(ctx, '>=', right, this.min(ctx)) as JelBoolean, Runtime.op(ctx, '<=', right, this.max(ctx)) as JelBoolean);

				case '===':
					return JelBoolean.falsestWithPromises(ctx, Runtime.op(ctx, '===', right, this.min(ctx)) as JelBoolean, Runtime.op(ctx, '===', right, this.max(ctx)) as JelBoolean);

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

	static create_jel_mapping = ['distributionPoints', 'average', 'min', 'max', 'mean'];
	static create(ctx: Context, ...args: any[]): Distribution {
		return new Distribution(TypeChecker.optionalType('List', args[0], 'distributionPoints'), 
														TypeChecker.optionalNumeric(args[1], 'average'), TypeChecker.optionalNumeric(args[2], 'min'), 
														TypeChecker.optionalNumeric(args[3], 'max'), TypeChecker.optionalNumeric(args[4], 'mean'));
	}  
}


Distribution.prototype.JEL_PROPERTIES = {average: 1, points: 1};
Distribution.prototype.mean_jel_mapping = {};
Distribution.prototype.min_jel_mapping = {};
Distribution.prototype.max_jel_mapping = {};
Distribution.prototype.getValue_jel_mapping = {share: 1};
Distribution.prototype.getShare_jel_mapping = {value: 1};
Distribution.prototype.add_jel_mapping = {distributionPoints: 1, average: 2, min: 3, max: 4, mean: 5 };
