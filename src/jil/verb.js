
// Abstract base class for all verbs
class Verb {
 
  constructor(who, tense = Verb.PRESENT, continous = false, completed = false, intention = false, ability = false, obligation = 0, adverbs = []) {
    this.who = who; // who is acting
  }
}

Verb.PAST = 1;
Verb.PRESENT = 2;
Verb.FUTURE = 3;
