'use strict';

const JelType = require('../jel/type.js');

class DatabaseConfig extends JelType {

  constructor(version = 1, sizing = 10000, prettyPrint = true) {
    this.version = version;
    this.sizing = sizing;
    this.prettyPrint = prettyPrint;
  }
  
  static create(version, sizing, prettyPrint) {
    return new DatabaseConfig(version, sizing, prettyPrint);
  }
}

DatabaseConfig.prototype.JEL_PROPERTIES = {version: 1, sizing: 1, prettyPrint: 1};
DatabaseConfig.create_jel_mapping = {version: 0, sizing: 1, prettyPrint: 2};

module.exports = DatabaseConfig;
