'use strict';

const JelType = require('../jel/type.js');
const DbEntry = require('./dbentry.js');

class DbRef extends JelType {
	
	constructor(distinctNameOrEntry) {
		super();
		if (distinctNameOrEntry instanceof DbEntry) {
			this.distinctName = distinctNameOrEntry.distinctName;
			this.cached = distinctNameOrEntry;
		}
		else	
			this.distinctName = distinctNameOrEntry;
	}
	
	//
	// returns either DbEntry or Promise!
	get(ctxOrSession) {
		const dbSession = DbRef.getSession(ctxOrSession);
	
		if (this.cached !== undefined)
			return this.cached;
		
		this.cached = dbSession.getFromCache(this.distinctName);
		if (this.cached !== undefined)
			return this.cached;
		else
			return dbSession.getFromDatabase(this.distinctName).then(r=>this.cached = r);
	}

	// returns either DbEntry or Promise!
	getFromDb(database) {
		if (this.cached !== undefined)
			return this.cached;
		return database.get(this.name);
	}
	
	get isAvailable() {
		return this.cached !== undefined;
	}
	
  getSerializationProperties() {
    return {distinctName: this.distinctName};
  }	
	
  static toPromise(ctxOrSession, ref) {
		return Promise.resolve(ref instanceof DbRef ? ref.get(DbRef.getSession(ctxOrSession)) : ref);
	}
  
 	static getSession(ctxOrSession) {
		const dbSession = ctxOrSession.dbSession || (ctxOrSession.getByIndex ? ctxOrSession : null);
		if (!dbSession)
			throw new Error('Can not execute DbRef without DatabaseSession in context.');
		return dbSession;
	}

	static create(distinctName) {
		if (distinctName instanceof DbRef)
			return distinctName;
		return new DbRef(distinctName);
	}
}

DbRef.create_jel_mapping = {distinctName: 0, dbEntry: 0};

module.exports = DbRef;

