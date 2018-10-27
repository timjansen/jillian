import Runtime from '../jel/Runtime';
import JelObject from '../jel/JelObject';
import Context from '../jel/Context';
import Serializable from '../jel/Serializable';

export default class DatabaseConfig extends JelObject implements Serializable {
  version: number;
  sizing: number;
  prettyPrint: boolean;

  JEL_PROPERTIES: Object;
  
  constructor({version=1, sizing=10000, prettyPrint=true} = {}) {
    super();
    this.version = version;
    this.sizing = sizing;
    this.prettyPrint = prettyPrint;
  }

  get directoryDepth() {
    return Math.floor(Math.log(this.sizing) / Math.log(256));
  }
  
  getSerializationProperties(): Object {
    return {version: this.version, sizing: this.sizing, prettyPrint: this.prettyPrint};
  }
  
  static create_jel_mapping = Runtime.NAMED_ARGUMENT_METHOD;
  static create(ctx: Context, config: DatabaseConfig): DatabaseConfig {
    return new DatabaseConfig(config);
  }
}

DatabaseConfig.prototype.JEL_PROPERTIES = {version: 1, sizing: 1, prettyPrint: 1};

