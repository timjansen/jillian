

class Category {

  constructor(superCategory, distinctName, reality) {
    this.superCategory = superCategory;
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

