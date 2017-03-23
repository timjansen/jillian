
const natural = require('natural');
const tokenizer = new natural.TreebankWordTokenizer();  // https://github.com/NaturalNode/natural

// Step 1: try to parse directly using the parse tree
// Step 2: word replacements (e.g. "n't" -> "not")
// Step 3: try parsing again
// Step 4: reduce fluff ("please", "dear jillian")\
// Step 5: try parsing again
