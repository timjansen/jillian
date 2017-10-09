import JelNode from './JelNode';
import Context from '../Context';

export default class Literal extends JelNode {
  static TRUE = new Literal(true);
	
	constructor(public value: any) {
    super();
  }

  // override
  execute(ctx: Context): any {
    return this.value;
  }
  
  // override
  equals(other?: JelNode): boolean {
		return other instanceof Literal &&
      this.value == other.value;
	}
  
	toString(): string {
		return JSON.stringify(this.value);
	}  
	
  getSerializationProperties(): any[] {
    return [this.value];
  }
}



