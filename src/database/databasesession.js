'use strict';


class DatabaseSession {

  constructor(database) {
    this.database = database;
    this.sessionCache = {};
  }

  // return either a value or a Promise!
  get(distinctName) {
    const cached = this.sessionCache[distinctName];
    if (cached !== undefined)
      return cached;
    return this.database.get(distinctName)
    .then(obj =>this.sessionCache[distinctName] = obj);
  }
}


module.exports = DatabaseSession;
