/*
Reader for the phrase file. 

Each phrase consists of an english text, a set of additional conditions, a set of properties and a result tree.

Rules for input phrases:
- [option1|option2] are several required options
- [[word]] is an optional word
- [[word|word|word]] are several optional words (only one match)
- {name: @type} is a named type instance (variable)

Example: [What's|What is|Whats] (the) {time: @currentTime} 


Additional conditions allow to further restrict matches, e.g. by requiring dependencies between variables.

Properties describe how the phrase is asking, e.g. how polite it is.

The result tree is the translation in the JIL (Jillian Intermediate Language).




*/

var phraseReader = {
  addPhrase(phrase, conditions, properties, resultTree) {
  
  
  
  }, 

  // cleanPhrase: the phrase as an array, one entry per word, wildcards replaces with WildcardNode
  addCleanPhrase(cleanPhrase, conditions, properties, resultTree) {
  
  
  
  }

};

exports.phraseReader = phraseReader;
