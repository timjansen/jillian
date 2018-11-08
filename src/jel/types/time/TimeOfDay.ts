import * as moment from 'moment';

import Util from '../../../util/Util';
import JelObject from '../../JelObject';
import Context from '../../Context';
import JelBoolean from '../JelBoolean';
import JelNumber from '../JelNumber';
import UnitValue from '../UnitValue';
import Duration from './Duration';
import TypeChecker from '../TypeChecker';

/**
 * Represents a time of day.
 */
export default class TimeOfDay extends JelObject {
	static readonly MIDNIGHT = new TimeOfDay(0, 0, 0);
	static readonly NOON = new TimeOfDay(12, 0, 0);

	JEL_PROPERTIES: Object;

	
	constructor(public hour: number, public minute: number|null = null, public seconds: number|null = null) {
		super();
	}
	
	isValid(): boolean {
		return (this.hour >= 0 && this.hour <= 23) && 
			(this.minute != null ? (this.minute >= 0 && this.minute < 60) : this.seconds == null) && 
			(this.seconds == null || (this.seconds >= 0 && this.seconds < 60));
	}
	
	simplify(): TimeOfDay {
		if (this.isValid())
			return this;

		if (this.minute == null) {
			if (this.hour < 0 || this.hour >= 23)
				return new TimeOfDay((this.hour + Math.abs(Math.trunc(this.hour/24)+1)*24)%24);
			else
				return this;
		}
		
		const rawSecs = Math.round(this.hour * 3600 + this.minute * 60 + (this.seconds||0));
		const dayLength = 24*3600;
		const timeInSecs = ((rawSecs + Math.abs(Math.trunc(rawSecs/dayLength)+1)*dayLength)%dayLength);
		const h = Math.trunc(timeInSecs/3600);
		const m = Math.trunc((timeInSecs-h*3600)/60);
		const s = timeInSecs-h*3600-m*60;
		return new TimeOfDay(h, m, this.seconds == null ? null : s);
	}
	
	op(ctx: Context, operator: string, right: JelObject): any {
		if (right instanceof TimeOfDay) {
			switch (operator) {
				case '==':
					return JelBoolean.valueOf(this.hour == right.hour && 
						(this.minute == right.minute || this.minute == null || right.minute == null) &&
						(this.seconds == right.seconds || this.seconds == null || right.seconds == null));
				case '===':
					return JelBoolean.valueOf(this.hour === right.hour && this.minute === right.minute && this.seconds === right.seconds);
				case '>':
				case '>>':
					return JelBoolean.valueOf(this.hour * 3600 + (this.minute||0) * 60 + (this.seconds||0) > right.hour * 3600 + (right.minute||0) * 60 + (right.seconds||0));
				case '-':
					return new Duration(0,0,0, this.hour - right.hour, (this.minute == null && right.minute == null) ? 0 : (this.minute||0) - (right.minute||0), (this.seconds == null && right.seconds == null) ? 0 : (this.seconds||0) - (right.seconds||0)).simplify();
			}
		}
		else if (right instanceof Duration) {
			switch (operator) {
				case '+':
					return new TimeOfDay(this.hour + right.hours, this.minute == null ? null : (this.minute||0) + right.minutes, this.seconds == null ? null : Math.round((this.seconds||0) + right.seconds)).simplify();
				case '-':
					return new TimeOfDay(this.hour - right.hours, this.minute == null ? null : (this.minute||0) - right.minutes, this.seconds == null ? null : Math.round((this.seconds||0) - right.seconds)).simplify();
			}
		}
		else if (right instanceof UnitValue) {
			switch (operator) {
				case '+':
				case '-':
					return Util.resolveValue(right.convertTo(ctx, 'Second'), seconds=>this.op(ctx, operator, new Duration(0,0,0, 0,0,seconds)));
			}
		}
		return super.op(ctx, operator, right);
	}

	toString(): string {
		return `TimeOfDay(hour=${this.hour}, minute=${this.minute}, seconds=${this.seconds})`;
	}
	
	getSerializationProperties(): any[] {
		return [this.hour, this.minute, this.seconds];
	}
	
	static create_jel_mapping = {hour: 1, minute: 2, seconds: 3};
	static create(ctx: Context, ...args: any[]): any {
		const td = new TimeOfDay(TypeChecker.realNumber(args[0], 'hour', 0), TypeChecker.optionalRealNumber(args[1], 'minute'), TypeChecker.optionalRealNumber(args[2], 'seconds'));
		if (!td.isValid())
			throw new Error('Invalid time of day: '+td.toString());
		return td;
	}

}

TimeOfDay.prototype.JEL_PROPERTIES = {hour:1, minute:1, seconds: 1};
TimeOfDay.prototype.reverseOps = {'+':1, '-': 1};

