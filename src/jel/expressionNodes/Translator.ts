import JelNode from './JelNode';
import JelTranslator from '../Translator';
import PatternAssignment from './PatternAssignment';
import Context from '../Context';

export default class Translator extends JelNode {
  constructor(public elements: PatternAssignment[] = []) {
    super();
  }

  // override
  execute(ctx: Context): JelTranslator {
    const t = new JelTranslator();
    this.elements.forEach(e=>t.addPattern(e.name, e.expression, e.getMetaData(ctx)));
    return t;
  }
  
  // override
  equals(other?: JelNode): boolean {
		return other instanceof Translator &&
      this.elements.length == other.elements.length && 
      !this.elements.find((l, i)=>!l.equals(other.elements[i]));
	}

  toString(): string {
		return `Translator(${this.elements.map(s=>s.toString()).join(', ')})`;	
	}
	
  getSerializationProperties(): any[] {
    return [this.elements];
  }
}
