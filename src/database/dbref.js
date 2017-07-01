'use strict';

const LazyRef = require('../jel/lazyref.js');

class DbRef extends LazyRef {
	
	constructor(distinctName) {
		super();
		this.distinctName = distinctName;
	}
	
	get(ctx) {
		if (!ctx.dbSession)
			throw new Error('Can not execute DbRef without DatabaseSession in context.');
	
		if (this.cached !== undefined)
			return this.cached;
		
		this.cached = ctx.dbSession.getFromCache(this.distinctName);
		if (this.cached !== undefined)
			return this.cached;
		else
			return ctx.dbSession.getFromDatabase(this.distinctName);
	}
	
	get isAvailable() {
		return this.cached !== undefined;
	}
	
  getSerializationProperties() {
    return {distinctName: this.distinctName};
  }	
	
	static create(distinctName) {
		return new DbRef(distinctName);
	}
}

DbRef.create_jel_mapping = {distinctName: 0};

module.exports = DbRef;

