'use strict';

const JelType = require('../jel/type.js');

class DatabaseConfig extends JelType {

  constructor({version=1, sizing=10000, prettyPrint=true} = {}) {
    super();
    this.version = version;
    this.sizing = sizing;
    this.prettyPrint = prettyPrint;
  }

  getSerializationProperties() {
    return {version: this.version, sizing: this.sizing, prettyPrint: this.prettyPrint};
  }
  
  static create(config) {
    return new DatabaseConfig(config);
  }
}

DatabaseConfig.prototype.JEL_PROPERTIES = {version: 1, sizing: 1, prettyPrint: 1};
DatabaseConfig.create_jel_mapping = 'named';

module.exports = DatabaseConfig;
