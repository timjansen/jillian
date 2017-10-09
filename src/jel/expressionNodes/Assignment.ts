import JelNode from './JelNode';
import JelType from '../JelType';
import Context from '../Context';
import Serializable from '../Serializable';

export default class Assignment extends JelNode implements Serializable {
  constructor(public name: string, public expression: JelNode) {
    super();
  }

  // override
  execute(ctx: Context): any {
      return this.expression.execute(ctx);
  }
 
  // override
  equals(other?: JelNode): boolean {
		if (!(other instanceof Assignment))
			return false;
		return this.name == other.name && this.expression.equals(other.expression);
	}
  
  getSerializationProperties(): Object {
    return {name: this.name, expression: this.expression};
  }
	
	toString(separator='='): string {
		return `${this.name}${separator}${this.expression.toString()}`;
	}
}

