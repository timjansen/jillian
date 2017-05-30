

const REVERSIBLE_OPS = {
	'+': '+',
	'*': '*',
	'==': '==',
	'!=': '!=',
	'===': '===',
	'!==': '!==',
	'>': '<',
	'>>': '<<',
	'<': '>',
	'<<': '>>',
	'>=': '>=',
	'>>=': '<<=',
	'<=': '>=',
	'<<=': '>>='
};

const NATIVE_OPS = {
	'+': (l,r)=>l+r,
	'-': (l,r)=>l-r,
	'*': (l,r)=>l*r,
	'/': (l,r)=>l/r,
	'&&': (l,r)=>l&&r,
	'||': (l,r)=>l||r,
	'==': (l,r)=>l===r,
	'===': (l,r)=>l===r,
	'!=': (l,r)=>l!==r,
	'!==': (l,r)=>l!==r,
	'<': (l,r)=>l<r,
	'<<': (l,r)=>l<r,
	'<=': (l,r)=>l<=r,
	'<<=': (l,r)=>l<=r,
	'>': (l,r)=>l>r,
	'>>': (l,r)=>l>r,
	'>=': (l,r)=>l>=r,
	'>>=': (l,r)=>l>=r
};

const SINGLE_NATIVE_OPS = {
	'!': (l)=>!l,
	'-': (l)=>-l,
	'+': (l)=>+l
}


class Type {
	static op(operator, left, right) {
		if (left instanceof Type)
			return left.op(operator, right);
		else if (operator in REVERSIBLE_OPS && right instanceof Type) 
			return op(REVERSIBLE_OPS[operator], right, left);
		else if (left == null)
			return left; 
		else if (right == null)
			return right;

		const nativeOp = NATIVE_OPS[operator];
		if (!nativeOp)
			throw new Error(`Operator "${operator}" is not supported for primitive types`);
		return nativeOp(left, right);
	}
	
	static singleOp(operator, left) {
		if (left instanceof Type)
			return left.singleOp(operator);
		else if (left == null)
			return left; 

		const nativeOp = SINGLE_NATIVE_OPS[operator];
		if (!nativeOp)
			throw new Error(`Operator "${operator}" is not supported for primitive types`);
		return nativeOp(left);
	}
	
	op(operator, right) {
		throw new Error(`Operator "${operator}" is not supported for this type`);
	}

	singleOp(operator) {
		throw new Error(`Operator "${operator}" is not supported for this type`);
	}

	toBoolean() {
		throw new Error(`Boolean conversion not supported for this type`);
	}

}

