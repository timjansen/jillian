import Runtime from '../jel/Runtime';
import JelObject from '../jel/JelObject';
import Context from '../jel/Context';
import Serializable from '../jel/Serializable';
import TypeChecker from '../jel/types/TypeChecker';
import Float from '../jel/types/Float';
import JelBoolean from '../jel/types/JelBoolean';
import Dictionary from '../jel/types/Dictionary';

export default class DatabaseConfig extends JelObject implements Serializable {
  version: number;
  sizing: number;
  prettyPrint: boolean;

  JEL_PROPERTIES: Object;
  
  constructor(config = new Map<string, JelObject|null>()) {
    super();
    
    this.version = Float.toRealNumber(config.get('version')) || 1;
    this.sizing = Float.toRealNumber(config.get('sizing')) || 10000;
    this.prettyPrint = config.get('prettyPrint') == null ?  true : JelBoolean.toRealBoolean(config.get('prettyPrint'));
  }

  get directoryDepth() {
    return Math.floor(Math.log(this.sizing) / Math.log(256));
  }
  
  getSerializationProperties(): Object {
    return [Dictionary.fromObject({version: this.version, sizing: this.sizing, prettyPrint: this.prettyPrint})];
  }
  
  static create_jel_mapping = ['config'];
  static create(ctx: Context, config: any): DatabaseConfig { 
    return new DatabaseConfig(TypeChecker.optionalInstance(Dictionary, config, 'config') ? config.elements : undefined);
  }
}

DatabaseConfig.prototype.JEL_PROPERTIES = {version: 1, sizing: 1, prettyPrint: 1};

