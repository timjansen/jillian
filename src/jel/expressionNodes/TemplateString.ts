import JelNode from './JelNode';
import Literal from './Literal';
import CachableJelNode from './CachableJelNode';
import JelObject from '../JelObject';
import BaseTypeRegistry from '../BaseTypeRegistry';
import Context from '../Context';
import Util from '../../util/Util';
import SourcePosition from '../SourcePosition';

/**
 * Represents a template string ('this will be executed: {{1+2+3}} done').
 *
 * Examples: 
 *  'Your name is {{name}}.'
 */
export default class TemplateString extends CachableJelNode {
  string: any;
  // ctor must be called with expressions.length>0 and stringFragments.length==expressions.length+1, so there are interleaved string-expression-string-expression-string...
  constructor(position: SourcePosition, public stringFragments: string[], public expressions: JelNode[]) {
    super(position);
    if (stringFragments.length != expressions.length+1)
      throw new Error('Invalid number of stringFragments for the expressions.');
    this.string = BaseTypeRegistry.get('String');
  }
  
  build(values: string[]): JelObject {
    let a = this.stringFragments[0]; 
    for (let i = 0; i < values.length; i++)
      a += values[i].toString()+this.stringFragments[i+1];
    return this.string.valueOf(a);  
  }
  
  // override
  executeUncached(ctx: Context): JelObject {
    return Util.resolveArray(this.expressions.map(o=>o.execute(ctx)), v=>this.build(v));
  }
  
  isStaticUncached(ctx: Context) {
    return !this.expressions.find(o=>!o.isStatic(ctx));
  }
  
  flushCache(): void {
    super.flushCache();
    this.expressions.forEach(a=>a.flushCache());
  }
  
  // overrride
  equals(other?: JelNode): boolean {
		return other instanceof TemplateString && 
      this.stringFragments.length == other.stringFragments.length && 
      !this.stringFragments.find((l, i)=>l != other.stringFragments[i]) && 
      this.expressions.length == other.expressions.length && 
      !this.expressions.find((l, i)=>!l.equals(other.expressions[i]));
  }

	toString(): string {
    let a = Literal.escapeString(this.stringFragments[0]);
    for (let i = 0; i < this.expressions.length; i++)
      a += `{{${this.expressions[i].toString()}}}${Literal.escapeString(this.stringFragments[i+1])}`;
    return `'${a}'`;
	}
}

