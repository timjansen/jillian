import JelNode from './JelNode';
import JelPattern from '../Pattern';
import Context from '../Context';
import Util from '../../util/Util';

export default class Pattern extends JelNode {
  constructor(public pattern: JelPattern) {
    super();
  }
  
  // override
  execute(ctx: Context): any {
    return this.pattern;
  }
  
  
  // overrride
  equals(other?: JelNode): boolean {
		return (other instanceof Pattern) &&
      this.pattern.equals((other as Pattern).pattern);
	}
  
	toString(): string {
		return Pattern.toString(this.pattern);	
	}
	
	static toString(p: JelPattern): string {
		return '`' + p.patternText.replace(/`/g, '\\`').replace(/\n/g, '\\n') + '`';	
	}
	
	
  getSerializationProperties(): JelPattern[] {
    return [this.pattern];
  }
}
