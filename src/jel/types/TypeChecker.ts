import FunctionCallable from '../FunctionCallable';
import JelObject from '../JelObject';
import Numeric from './Numeric';
import {IDbRef} from '../IDatabase';
import Context from '../Context';
import BaseTypeRegistry from '../BaseTypeRegistry';
import Util from '../../util/Util';


/**
 * Helper methods for checking types
 */
export default class TypeChecker {
	
	static throwArgumentError(value: any, name: string, type?: string): never {
		if (value === undefined)
			throw new Error(`Required argument ${name} missing.`);
		if (value === null)
			throw new Error(`Required argument ${name} missing or null.`);
		if (value.getJelType) {
			if (type)
				throw new Error(`Required argument ${name} has wrong type. ${name} must be ${type}. But I got a ${value.getJelType()}: ${value.toString()}.`);
			else
				throw new Error(`Required argument ${name} has wrong type. Instead it had type ${value.getJelType}.`);
		}
		else {
			if (type)
				throw new Error(`Required argument ${name} has wrong type. ${name} must be ${type}. Value was not a JelObject, but a ${value.constructor.name}.`);
			else
				throw new Error(`Required argument ${name} has wrong type. Value was not a JelObject.`);
		}
	}

	static notNull<T>(value: T | null | undefined, name: string, ): T {
		if (value == null)
			return TypeChecker.throwArgumentError(value, name);
		return value;
	}

	
	static optionalNumeric(value: any, name: string, defaultValue: Numeric | null = null): Numeric | null {
		if (value == null)
			return defaultValue;
		
		const typeName: string = value.getJelType ? value.getJelType() : '';
		if (typeName == 'Number' || typeName == 'Fraction' || typeName == 'ApproximateNumber' || typeName == 'UnitValue')
			return value;
		if (typeof value == 'number')
			return BaseTypeRegistry.get('Number').valueOf(value);
		return TypeChecker.throwArgumentError(value, name, 'numeric');
	}

	static numeric(value: any, name: string, defaultValue?: Numeric): Numeric {
		return TypeChecker.notNull(TypeChecker.optionalNumeric(value, name, defaultValue), name);
	}
	
	static optionalRealNumber(value: any, name: string, defaultValue: number | null = null): number | null {
		if (value == null)
			return defaultValue;
		
		const typeName: string = value.getJelType ? value.getJelType() : '';
		if (typeName == 'Number' || typeName == 'Fraction' || typeName == 'ApproximateNumber' || typeName == 'UnitValue')
			return value.toRealNumber();
		if (typeof value == 'number')
			return value;
		return TypeChecker.throwArgumentError(value, name, 'numeric');
	}

	static realNumber(value: any, name: string, defaultValue?: number): number {
		return TypeChecker.notNull(TypeChecker.optionalRealNumber(value, name, defaultValue), name);
	}

	static optionalBoolean(value: any, name: string, defaultValue: any = null): any {
		if (value == null)
			return defaultValue;
		
		const typeName: string = value.getJelType ? value.getJelType() : '';
		if (typeName == 'Boolean')
			return value;
		if (typeof value == 'boolean')
			return BaseTypeRegistry.get('Boolean').valueOf(value);
		return TypeChecker.throwArgumentError(value, name, 'boolean');
	}

	static boolean(value: any, name: string, defaultValue?: any): any {
		return TypeChecker.notNull(TypeChecker.optionalBoolean(value, name, defaultValue), name);
	}

	static optionalRealBoolean(value: any, name: string, defaultValue: any = null): boolean | null {
		if (value == null)
			return defaultValue;
		
		const typeName: string = value.getJelType ? value.getJelType() : '';
		if (typeName == 'Boolean')
			return value.toRealBoolean();
		if (typeof value == 'boolean')
			return value;
		return TypeChecker.throwArgumentError(value, name, 'boolean');
	}

	static realBoolean(value: any, name: string, defaultValue?: boolean): boolean {
		return TypeChecker.notNull(TypeChecker.optionalRealBoolean(value, name, defaultValue), name);
	}
	
	
	static optionalString(value: any, name: string, defaultValue: any = null): any {
		if (value == null)
			return defaultValue;
		
		const typeName: string = value.getJelType ? value.getJelType() : '';
		if (typeName == 'String')
			return value;
		if (typeof value == 'string')
			return BaseTypeRegistry.get('String').valueOf(value);
		return TypeChecker.throwArgumentError(value, name, 'string');
	}

	static string(value: any, name: string, defaultValue?: any): any {
		return TypeChecker.notNull(TypeChecker.optionalString(value, name, defaultValue), name);
	}

	static optionalRealString(value: any, name: string, defaultValue: any = null): any {
		if (value == null)
			return defaultValue;
		
		const typeName: string = value.getJelType ? value.getJelType() : '';
		if (typeName == 'String')
			return value.value;
		if (typeof value == 'string')
			return value;
		return TypeChecker.throwArgumentError(value, name, 'string');
	}

	static realString(value: any, name: string, defaultValue?: string): any {
		return TypeChecker.notNull(TypeChecker.optionalRealString(value, name, defaultValue), name);
	}
	
	static optionalDbRef(value: any, name: string, defaultValue: any = null): IDbRef | null {
		if (value == null)
			return defaultValue;
		
		if (value.isIDBRef)
			return value;
		return TypeChecker.throwArgumentError(value, name, 'DbRef');
	}

	static dbRef(value: any, name: string, defaultValue?: any): IDbRef {
		return TypeChecker.notNull(TypeChecker.optionalDbRef(value, name, defaultValue), name);
	}
	
  static isIDbRef(value: any) {
    return !!(value && value.isIDBRef);
  }

  static isIClass(value: any) {
    return !!(value && value.className);
  }
  
	static optionalType(typeName: string, value: any, name: string, defaultValue: any = null): any {
		if (value == null)
			return defaultValue;
		
		if (typeName == (value.getJelType ? value.getJelType() : ''))
			return value;
		return TypeChecker.throwArgumentError(value, name, typeName);
	}

	static type(typeName: string, value: any, name: string, defaultValue?: any): any {
		return TypeChecker.notNull(TypeChecker.optionalType(typeName, value, name, defaultValue), name);
	}

	static optionalTypes(typeNames: string[], value: any, name: string, defaultValue: any = null): any {
		if (value == null)
			return defaultValue;
		
		const actualTypeName: string =  value.getJelType ? value.getJelType() : '';
		for (let tn of typeNames)
			if (tn == actualTypeName)
				return value;
		return TypeChecker.throwArgumentError(value, name, 'one of the following types: ' + typeNames.join(', '));
	}

	static types(typeNames: string[], value: any, name: string, defaultValue?: any): any {
		return TypeChecker.notNull(TypeChecker.optionalTypes(typeNames, value, name, defaultValue), name);
	}

	static optionalInstance(ctor: any, value: any, name: string, defaultValue: any = null): any {
		if (value == null)
			return defaultValue;
		
		if (value instanceof ctor)
			return value;
		return TypeChecker.throwArgumentError(value, name, ctor.name);
	}

	static instance(ctor: any, value: any, name: string, defaultValue?: any): any {
		return TypeChecker.notNull(TypeChecker.optionalInstance(ctor, value, name, defaultValue), name);
	}

 	static listOfStrings(value: any, name: string): any {
		if (value == null)
			return BaseTypeRegistry.get('List').empty;
		
		if ((value.getJelType ? value.getJelType() : '') == 'List') {
      for (let s of value.elements)
        TypeChecker.string(s, name);
      return value;
    }
    
    return BaseTypeRegistry.get('List').valueOf([TypeChecker.string(value, name)]);
	}

}


