import JelNode from './JelNode';
import CachableJelNode from './CachableJelNode';
import JelObject from '../JelObject';
import Context from '../Context';
import SourcePosition from '../SourcePosition';
import DeclaringStatement from './DeclaringStatement';
import Util from '../../util/Util';


/**
 * Represents an import to either import a single, packaged element or all of them.
 * 
 * Example:
 *   import IL::Sentence
 *   import IL::*
 */
export default class Import extends CachableJelNode  implements DeclaringStatement {
  isDeclaringStatement = true;
  name: string|undefined;

  constructor(position: SourcePosition, public fullName: string, public importChildren: boolean) {
    super(position, []);
    this.name = importChildren ? undefined : fullName.replace(/^.*::/, '');
  }

  // override
  executeUncached(ctx: Context): JelObject|null|Promise<JelObject|null> {
    if (this.importChildren)
      return Util.resolveValue(ctx.get(this.fullName), pkg=>{
        if (pkg.className != 'Package')
          throw new Error(`Can not load '${this.fullName}' with wildcard: it is not a Package, but a ${pkg.className}. Only packages are allowed.`);
        return pkg.packageContent;
      });
    else
      return ctx.get(this.fullName);
  }
  
  isStaticUncached(ctx: Context): boolean {
    return true;
  }
  
  // override
  equals(other?: JelNode): boolean {
		if (!(other instanceof Import))
			return false;
		return this.fullName == other.fullName && this.importChildren == other.importChildren;
	}
  
  getSerializationProperties(): Object {
    return [this.name, this.importChildren];
  }
	
	toString(separator='='): string {
		return this.importChildren ? `import ${this.fullName}::*` : `import ${this.fullName}`;
	}
}

