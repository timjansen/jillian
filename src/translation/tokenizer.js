'use strict';

//                          name:                   templateName        .hint.hint              expression
const patternTemplateRE = /^\s*(?:([a-zA-Z_$][\w_$]*):)?\s*([a-zA-Z_$][\w_$]*)(?:\.(\w+(?:\.\w+)*))?\s*(?:::\s*(.*))?$/;

class Tokenizer {
	static tokenizePattern(pattern) {
		//          simple word              choice ops      template
		const re = /\s*(?:([^\s\[\{\|\[\]]+)|(\[|\]\?|\]|\|)|\{\{((?:[^}]|\}[^}])+)\}\}|(.*))\s*/g;
		
		let m, tokensLeft = 10000;
    const tokens = [];
    while ((m = re.exec(pattern)) && tokensLeft--) {
			if (m[1] != null)
				tokens.push({word: m[1]});
			else if (m[2] != null)
				tokens.push({op: m[2]});
			else if (m[3] != null)
				tokens.push(Tokenizer.parsePatternTemplate(m[3]));
			else if (m[4])
        throw new Error(`Unsupported token found in pattern: "${m[4]}"`);
    }
    return {tokens, 
            i: 0, 
            next() {return tokens[this.i++];}, 
            undo() {this.i--;}
    };
	}

	static parsePatternTemplate(tpl) {
		const m = patternTemplateRE.exec(tpl);
		if (!m)
			throw new Error(`Can not parse pattern template: {{${tpl}}}`);
		return {name: m[1], template: m[2], hints: m[3] ? m[3].split('.') : [], expression: m[4]};
	}
}

module.exports = Tokenizer;