import JelNode from './JelNode';
import JelPattern from '../types/Pattern';
import Context from '../Context';
import Util from '../../util/Util';

/**
 * Represents a word matching pattern.
 *
 * Examples:
 *  `foot`                      // matches the word 'foot'
 *  `he went away`              // matches the sentence 'he went away'
 *	`[it|he|she] walked away`   // matches the sentences 'it walked away', 'he walked away' and 'she walked away'
 *	`he [quickly]? walked away`   // matches the sentences 'he walked away' and 'he quickly walked away'
 *	`he [slowly|quickly]? walked away`   // matches the sentences 'he walked away', 'he quickly walked away' and 'he slowly walked away'
 *	`he went {{destination}}`            // matches the words 'he went' and then calls a Translator called 'destination' for the third
 *	`my name is {{n: name}}`             // uses the Translator 'name', and returns the result as variable 'n'
 *	`my favorite color is {{col: color}}`      
 *	`I like {{a: animal.plural}}`        // specifies that only Translator matches with the meta property 'plural' are used
 *	`I like {{a: animal.plural :: @Bird.isCategoryOf(a)}}`        // limits matches to instances of @Bird
 *  `This is number {{n: /[0-9]+/ :: Number.parse(n) > 0}}`       // Regular expression match
 *  `{{date: /([0-9]+)-([0-9]+)-([0-9]+)/ }}`                     // RE with groups: returns a List containing the three numbers
 *  `{{date: /[0-9]+/ /[0-9]+/ /[0-9]+/ }}`                       // Three REs, to match three words. Also returns list.
 */
export default class Pattern extends JelNode {
  constructor(public pattern: JelPattern) {
    super();
  }
  
  // override
  execute(ctx: Context): JelPattern {
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


