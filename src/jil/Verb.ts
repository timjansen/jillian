import JelObject from '../jel/JelObject';
import List from '../jel/types/List';
import JelBoolean from '../jel/types/JelBoolean';
import {Tense} from './Tense';

// Abstract base class for all verbs
export default class Verb extends JelObject {
 
  constructor(who?: List, 
							 tense = Tense.Present /*did it happen in the past, is it current or in the future?*/, 
							 continous = false, /*is it ongoing?*/ 
							 completed = false, /*it is completed or will it be completed?*/
							 intention = false, /*does it actually happen, or is it a intention?*/
							 ability?: JelBoolean, /*is it about a ability or it is actually happening. Fuzzy boolean: 0.6 is 'could', 1.0 are 'can' or 'able to' or 'capable of'*/
							 obligation?: JelBoolean, /*if talking about an obligation, the strength. should is 0.6, shall is 0.8, must is 1*/
							 adverbs?: List) {
    super();
  }
}

