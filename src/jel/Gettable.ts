import Context from './Context';

export default interface Gettable {
	get_jel_mapping: Object;
	get(ctx: Context, key: any): any;

}