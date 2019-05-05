import Runtime from '../jel/Runtime';
import JelObject from '../jel/JelObject';
import Context from '../jel/Context';
import Serializable from '../jel/Serializable';
import TypeChecker from '../jel/types/TypeChecker';
import Float from '../jel/types/Float';
import JelBoolean from '../jel/types/JelBoolean';
import Dictionary from '../jel/types/Dictionary';
import NativeJelObject from '../jel/types/NativeJelObject';
import Class from '../jel/types/Class';
import BaseTypeRegistry from '../jel/BaseTypeRegistry';

export default class DatabaseConfig extends NativeJelObject implements Serializable {  
  static clazz: Class|undefined;

  version: number;
  sizing: number;
  prettyPrint: boolean;
  validateEntries: boolean;

  constructor(config = new Map<string, JelObject|null>()) {
    super('DatabaseConfig');
    
    this.version = Float.toRealNumber(config.get('version')) || 1;
    this.sizing = Float.toRealNumber(config.get('sizing')) || 10000;
    this.prettyPrint = config.get('prettyPrint') == null ?  true : JelBoolean.toRealBoolean(config.get('prettyPrint'));
    this.validateEntries = config.get('validateEntries') == null ?  true : JelBoolean.toRealBoolean(config.get('validateEntries'));
  }
  
  get clazz(): Class {
    return DatabaseConfig.clazz!;
  }

  get directoryDepth() {
    return Math.floor(Math.log(this.sizing) / Math.log(256));
  }
  
  getSerializationProperties(): Object {
    return [Dictionary.fromObject({version: this.version, sizing: this.sizing, prettyPrint: this.prettyPrint, validateEntries: this.validateEntries})];
  }
  
  static create_jel_mapping = true;
  static create(ctx: Context, config: any): DatabaseConfig { 
    return new DatabaseConfig(TypeChecker.optionalInstance(Dictionary, config, 'config') ? config.elements : undefined);
  }
}

const p: any = DatabaseConfig.prototype;
p.version_jel_mapping = true;
p.sizing_jel_mapping = true;
p.prettyPrint_jel_mapping = true;
p.validateEntries_jel_mapping = true;

BaseTypeRegistry.register('DatabaseConfig', DatabaseConfig);
