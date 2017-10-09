import JelNode from './JelNode';
import Context from '../Context';
import DbRef from '../../database/DbRef';

// a @Name ref
export default class Reference extends JelNode {
	public readonly ref: DbRef;
  constructor(public name: string) {
    super();
    this.ref = new DbRef(this.name);
  }
  
  // override
  execute(ctx: Context): any {
    return this.ref;
  }
  
  // overrride
  equals(other?: JelNode): boolean {
		return other instanceof Reference &&
      this.name == other.name;
	}
  
	toString(): string {
		return `@${this.name}`;	
	}
	
  getSerializationProperties(): string[] {
    return [this.name];
  }
}

