import JelObject from '../JelObject';
import BaseTypeRegistry from '../BaseTypeRegistry';
import NativeJelObject from '../types/NativeJelObject';
import Class from '../types/Class';
import Dictionary from '../types/Dictionary';

const EMPTY_MAP = new Map();

// A match returned by a LamdaResultNode
export default class Match extends NativeJelObject {
  static clazz: Class|undefined;

	// value: the return value
	// index: the position after the match in the string array
	// meta: a string->value map of additional meta data
	constructor(public value: any, public index: number, public meta: Dictionary = Dictionary.empty) {
		super('Match');
	}

  get clazz(): Class {
    return Match.clazz!;
  }
}

const p: any = Match.prototype;
p.value_jel_property = true;
p.index_jel_property = true;
p.meta_jel_property = true;

BaseTypeRegistry.register('Match', Match);