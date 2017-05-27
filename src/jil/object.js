
// Base class for any kind of physical or immaterial instance of a category

class Object {
  

  constructor(category, distinctName, reality) {
    this.category = category;
    this.distinctName = distinctName;
    this.reality = reality;

    this.words = {};
    this.properties = {};
    this.speech = [];
  }
  
  addWord(language, word, probability = 1) {
  }
  
  addSentence(sentence) {
  }
  
}

