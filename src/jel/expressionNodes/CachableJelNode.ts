import JelObject from '../JelObject';
import JelNode from './JelNode';
import Context from '../Context';
import SourcePosition from '../SourcePosition';

/**
 * Represents a node in a JEL expression that can cache the value if isStatic().
 */
export default abstract class CachableJelNode extends JelNode  {
  private cache: JelObject|null|Promise<JelObject|null>|undefined;
  protected staticCache: boolean|undefined;
  
	// Returns either a value or a Promise for a value!
	abstract executeUncached(ctx: Context): JelObject|null|Promise<JelObject|null>;

  abstract isStaticUncached(ctx: Context): boolean;
  
  constructor(position: SourcePosition) {
    super(position);
  }
  
  isStatic(ctx: Context): boolean {
    if (this.staticCache === undefined)
      this.staticCache = this.isStaticUncached(ctx);
    return this.staticCache;
  }
  
  flushCache(): void {
    this.cache = undefined;
    this.staticCache = undefined;
  }
  
	executeImpl(ctx: Context): JelObject|null|Promise<JelObject|null> {
    if (this.cache !== undefined)
      return this.cache;

    const r = this.executeUncached(ctx);

    if (this.isStatic(ctx)) {
      this.cache = r;
      if (r instanceof Promise)
        r.then(r0=>(this.cache=r0));
    }
    return r;
	}
}
