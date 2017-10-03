import JelType from '../jel/JelType';
import {Tense} from './Tense';

// Abstract base class for all verbs
export default class Verb extends JelType {
 
  constructor(who?: any, tense = Tense.Present, continous = false, completed = false, intention = false, ability = false, obligation = 0, adverbs = []) {
    super();
  }
}

