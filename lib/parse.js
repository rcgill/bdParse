define(["./types", "./asn"], function(types, asn) {
	///
	// Defines the parser.

	var
		symbols= types.symbols,
		sumLocations= types.sumLocations,
		mix= types.mix,

		// tokens
		tLineComment= symbols["tLineComment"],
		tBlockComment= symbols["tBlockComment"],
		tOperator= symbols["tOperator"],
		tKeyword= symbols["tKeyword"],
		tPunc= symbols["tPunc"],
		tNumber= symbols["tNumber"],
		tString= symbols["tString"],
		tRegEx= symbols["tRegEx"],
		tName= symbols["tName"],
		tEof= symbols["tEof"],

		prog1= function(a) {
			// lisp prog1
			return a;
		},

		unaryPrefix= types.makeSymbolSet("typeof.void.delete.--.++.!.~.-.+"),

		isUnaryPrefix= function(token) {
			return token.type==tOperator && unaryPrefix[token.value];
		},

		unaryPostfix= types.makeSymbolSet("--.++"),

		isUnaryPostfix= function(token) {
			return token.type==tOperator && unaryPostfix[token.value];
		},

		assignment= types.makeSymbolSet("=.+=.-=.*=./=.%=.<<=.>>=.>>>=.&=.^=.|="),

		isAssignment= function(token) {
			return token.type===tOperator && assignment[token.value];
		},

		precedence= {
			"||": 1,

			"&&": 2,

			"|":  3,

			"^":  4,

			"&":  5,

			"==": 6,
			"===":6,
			"!=": 6,
			"!==":6,

			"<":  7,
			">":  7,
			"<=": 7,
			">=": 7,
			"in": 7,
			"instanceof": 7,

			"<<": 8,
			">>": 8,
			">>>":8,

			"+":  9,
			"-":  9,

			"*":  10,
			"/":  10,
			"%":  10
		},

		getPrecedence= function(op) {
			return precedence[op] || 0;
		};

	function parse(tokens, strictSemicolons) {
		var
			token,
			tokenPtr= 0,

		next= function() {
			return (token= tokens[tokenPtr++]);
		},

		peek= function() {
			return tokens[tokenPtr];
		},

		skip= function(n) {
			tokenPtr+= (n-1);
			return next();
		},

		eatComments= function() {
			while (token.type===tLineComment || token.type===tBlockComment) next();
		},

		getTokenAndAdvance= function(eatComments) {
			eatComments && eatComments();
			return prog1(token, next());
		},

		expectPunc= function(punc) {
			if (token.type===tPunc && token.value==punc) {
				return prog1(token, next());
			}
			throw token.unexpected("expected " + punc);
		},

		expectKeyword= function(word) {
			if (token.value===symbols[word]) {
				return prog1(token, next());
			}
			throw token.unexpected("expected keyword " + word);
		},

		expectSemicolon= function() {
			// TODO come back to this...should always return 0
			if (strictSemicolons) {
				return expectPunc(";");
			} else if (token.puncEq(";")) {
				return getTokenAndAdvance();
			} else if (token.newlineBefore || token.type===tEof) {
				return 0;
			} else if (token.puncEq("}")) {
				// maybe this is a block on a line without a semicolon, e.g.,
				//      { i= 1 + 2 }
				// assume this is what is happening; if not, we'll get an error at the next token
				return 0;
			} else {
				throw token.unexpected("expected ;");
			}
		},

		vardefs= function() {
			eatComments();
			if (token.type!==tName) {
				throw token.unexpected("expected identifier");
			}
			var
			name= getTokenAndAdvance(),
			initialValue, assignToken;
			if (token.opEq("=")) {
				assignToken= getTokenAndAdvance();
				initialValue= expression(false);
			}
			if (token.puncEq(",")) {
				return [new asn.LexicalVariableNode(name, assignToken, initialValue, next())].concat(vardefs());
			} else {
				return [new asn.LexicalVariableNode(name, assignToken, initialValue)];
			}
		},

		// token and keyword parsing procedures
		parseProcs= {
			//
			// token types
			//
			"tLineComment": function() {
				return prog1(new asn.CommentNode(token), next());
			},

			"tBlockComment": function() {
				return prog1(new asn.CommentNode(token), next());
			},

			"tNumber": function() {
				return simpleStatement();
			},

			"tString": function() {
				return simpleStatement();
			},

			"tRegEx": function() {
				return simpleStatement();
			},

			"tOperator": function() {
				return simpleStatement();
			},

			"tName": function() {
				if (peek().puncEq(":")) {
					var labelToken= token;
					skip(2);
					var s= statement();
					return new asn.LabelNode(labelToken, s);
				} else {
					return simpleStatement();
				}
			},

			"tPunc": function() {
				if (token.value=="{") {
					return block();
				} else if (token.value=="[" || token.value=="(") {
					return simpleStatement();
				} else if (token.value==";") {
					return new asn.StatementNode(0, getTokenAndAdvance());
				} else {
					throw token.unexpected();
				}
			},

			"tKeyword": function(allowCase) {
				var parse= parseProcs[token.value.value];
				if (parse) {
					return parse(getTokenAndAdvance(), allowCase);
				}
				throw token.unexpected();
			},

			//
			// keywords
			//
			"break": function(statementToken) {
				if (token.type===tName) {
					return new asn.BreakNode(statementToken, getTokenAndAdvance(), expectSemicolon());
				} else {
					return new asn.BreakNode(statementToken, 0, expectSemicolon());
				}
			},

			"continue": function(statementToken) {
				if (token.type===tName) {
					return new asn.ContinueNode(statementToken, getTokenAndAdvance(), expectSemicolon());
				} else {
					return new asn.ContinueNode(statementToken, 0, expectSemicolon());
				}
			},

			"case": function(token, allowCase) {
				if (allowCase) {
					return new asn.CaseNode(token, expression(), expectPunc(":"));
				}
				throw token.unexpected();
			},

			"default": function(token, allowCase) {
				if (allowCase) {
					return new asn.DefaultNode(token, expectPunc(":"));
				}
				throw token.unexpected();
			},

			"debugger": function(token) {
				return new asn.DebuggerNode(token, expectSemicolon());
			},

			"do": function(token) {
				var
				body= statement(),
				whileToken = expectKeyword("while"),
				condition = parenthesized();
				return new asn.DoNode(token, body, whileToken, condition, expectSemicolon());
			},

			"for": function(forToken) {
				var rightParen, leftParen = expectPunc("("),
					varToken= 0;
				if (token.keywordEq("var")) {
					varToken= getTokenAndAdvance();
				}
				if (token.type===tName && peek().opEq("in")) {
					var varNameToken= getTokenAndAdvance(),
						inToken = next(),
						objectExpr= expression();
					rightParen = expectPunc(")");
					return new asn.ForInNode(forToken, leftParen, varToken, varNameToken, inToken, objectExpr, rightParen, statement());
				} else {
					var init, test, step;
					if (token.puncEq(";")) {
						init= getTokenAndAdvance();
					} else {
						init= varToken ? vardefs() : expression();
						init.semicolon =  expectPunc(";");
					}
					if (token.puncEq(";")) {
						test= getTokenAndAdvance();
					} else {
						test= expression();
						test.semicolon = expectPunc(";");
					}
					step= token.puncEq(")") ? 0 : expression(),
					rightParen= expectPunc(")");
					return new asn.ForNode(forToken, leftParen, varToken, init, test, step, rightParen, statement());
				}
			},

			"function": function(functionToken, literal) {
				// literal implies a function literal expression e.g....
				//   x= function(...){...}
				//   someFunction(x, function(...){...}, ...)
				// not literal implies a definition like function x(...){...}

				var lambdaLeftParen, lambdaRightParen;

				function lambdaList() {
					var nameToken, result= [];
					while (!token.puncEq(")")) {
						if (token.type===tName) {
							nameToken= getTokenAndAdvance();
							if (token.puncEq(",")) {
								nameToken.commaToken = token;
								next();
							}
							result.push(nameToken);
						} else {
							throw token.unexpected("while processing lambda list");
						}
					}
					lambdaRightParen =  prog1(token, next());
					return result;
				}

				var nameToken= token.type===tName ? getTokenAndAdvance() : 0;
				if (!literal && !nameToken) {
					throw token.unexpected();
				}
				lambdaLeftParen = expectPunc("(");
				var
				parameterList= lambdaList(),
				blockLeftBrace = expectPunc("{"),
				body= [];

				while (!token.puncEq("}")) {
					body.push(statement());
				}
				return new (literal ? asn.FunctionLiteralNode : asn.FunctionDefNode)(functionToken, nameToken, lambdaLeftParen, parameterList, lambdaRightParen, blockLeftBrace, body, expectPunc("}"));
			},

			"if": function(ifToken) {
				var
				condition= parenthesized(),
				trueStatement= statement(),
				elseToken= 0,
				falseStatement= 0;
				if (token.keywordEq("else")) {
					elseToken= getTokenAndAdvance();
					falseStatement= statement();
				}
				return new asn.IfNode(ifToken, condition, trueStatement, elseToken, falseStatement);
			},

			"return": function(returnToken) {
				var expr;
				if (token.puncEq(";")) {
					expr = getTokenAndAdvance();
				}else if((token.puncEq("}") || token.newlineBefore) && !strictSemicolons){
					// return expr as undefined
				}else{
					expr = expression();
					expr.optionalSemicolon = expectSemicolon();
				}
				return new asn.ReturnNode(returnToken, expr);
			},



			"switch": function(switchToken) {
				var
				switchExpr= parenthesized(),
				caseList= [],
				openingBracket = expectPunc("{");
				while (!token.puncEq("}")) {
					caseList.push(statement(true));
				}
				return new asn.SwitchNode(switchToken, openingBracket, switchExpr, expectPunc("}"), caseList);
			},

			"throw": function(throwToken) {
				return new asn.ThrowNode(throwToken, expression(), expectSemicolon());
			},

			"try": function(tryToken) {
				var
					body= statement(),
					catchToken, leftParen, catchNameToken, rightParen, catchStatement, finallyToken, finallyStatement;
				if (token.keywordEq("catch")) {
					catchToken = next();
					leftParen = expectPunc("(");
					if (token.type===tName) {
						catchNameToken= prog1(token, next());
						rightParen = expectPunc(")");
						catchStatement= statement();
					} else {
						throw token.unexpected("expected name with catch clause");
					}
				}
				if (token.keywordEq("finally")) {
					finallyToken = next();
					finallyStatement= statement();
				}
				if (!catchNameToken && !finallyStatement) {
					throw token.unexpected("expected catch or finally clause");
				}
				return new asn.TryNode(tryToken, body, catchToken, leftParen, catchNameToken, rightParen, catchStatement, finallyToken, finallyStatement);
			},

			"var": function(varToken) {
				return new asn.VarNode(varToken, vardefs(), expectSemicolon());
			},

			"while": function(whileToken) {
				return new asn.WhileNode(whileToken, parenthesized(), statement());
			},

			"with": function(withToken) {
				return new asn.WithNode(withToken, parenthesized(), statement());
			}
		},

		//
		// expressions
		//
		exprList= function(closing) {
			var expr, list= [];
			while (!token.puncEq(closing)) {
				expr = expression(false);
				if(token.puncEq(",")){
					expr.terminatingPunc = next();
				}
				list.push(expr);
			}
			expr && (expr.terminatingPunc = token);
			return list;
		},

		parenthesized= function() {
			var leftParen= expectPunc("("),
				expr= expression(),
				rightParen= expectPunc(")");
			return new asn.ParenthesizedNode(leftParen, expr, rightParen);
		},

		arrayExpr= function() {
			return new asn.ArrayNode(expectPunc("["), exprList("]"), expectPunc("]"));
		},

		objectExpr= function() {
			function getName() {
				var token= getTokenAndAdvance();
				if (token.type===tNumber) {
					//TODO don't understand how it could be a number
					return mix(token.copy(), {type: tName, value: token.value+""});
				} else if (token.type===tKeyword) {
					return mix(token.copy(), {type: tName, value: token.value.value});
				} else if (token.type===tString) {
					return mix(token.copy(), {type: tName, value: token.value});
				} else if (token.type===tName) {
					return token;
				} else {
					throw token.unexpected("expected name");
				}
			}

			var
			opening= expectPunc("{"),
			list= [];
			while (!token.puncEq("}")) {
				list.push([getName(), expectPunc(":"), expression(false), token.puncEq(",") && next()]);
			}
			var closing= expectPunc("}");
			return new asn.ObjectNode(opening, list, closing);
		},

		newExpr= function() {
			var newToken= getTokenAndAdvance(),
				newExpr= atomExpr(),
				exprListNode;
			if(token.puncEq("(")){
				exprListNode = new asn.ExprListNode(next(), exprList(")"), getTokenAndAdvance());
			}
			return subscriptsExpr(new asn.NewNode(newToken, newExpr, exprListNode), true);
		},

		atomExpr= function(allowCalls) {
			eatComments();
			if (token.opEq("new")) {
				return newExpr();
			} else if (isUnaryPrefix(token)) {
				return new asn.UnaryPrefixNode(getTokenAndAdvance(), atomExpr(allowCalls));
			} else if (token.keywordEq("function")) {
				var functionTree= parseProcs["function"](getTokenAndAdvance(), true);
				// possible immediate application of literal function
				return token.puncEq("(") ? subscriptsExpr(functionTree) : functionTree;
			} else if (token.type.isExprAtom) {
				// for number, string, regex, name
				return subscriptsExpr(asn.AtomNode(getTokenAndAdvance()), allowCalls);
			} else if (token.value.isExprAtom) {
				// for keywords true, false, null
				var value = token.value.value;
				return subscriptsExpr(asn.AtomNode(mix(getTokenAndAdvance().copy(), {type: tName, value: value})), allowCalls);
			} else if (token.puncEq("(")) {
				return subscriptsExpr(parenthesized(), true);
			} else if (token.puncEq("[")) {
				return subscriptsExpr(arrayExpr(), true);
			} else if (token.puncEq("{")) {
				return subscriptsExpr(objectExpr(), true);
			} else {
				throw token.unexpected("expected atom for expression");
			}
		},

		subscriptsExpr= function(expr, allowCalls) {
			function getName() {
				var token= getTokenAndAdvance();
				if (token.type===tKeyword) {
					return asn.AtomNode(mix(token.copy(), {type: tName, value: token.value.value}));
				} else if (token.type===tName) {
					return asn.AtomNode(token);
				} else {
					throw token.unexpected("expected name");
				}
			}
			if (token.puncEq(".")) {
				return subscriptsExpr(new asn.BinaryOpNode(expr, getTokenAndAdvance(), getName()), allowCalls);
			} else if (token.puncEq("[")) {
				var
				opening= getTokenAndAdvance(),
				subExpr= expression(),
				closing= expectPunc("]");
				return subscriptsExpr(new asn.SubscriptNode(expr, opening, subExpr, closing), allowCalls);
			} else if (token.puncEq("(")) {
				var
				opening= getTokenAndAdvance(),
				args= exprList(")"),
				closing= getTokenAndAdvance();
				return subscriptsExpr(new asn.ApplicationNode(expr, opening, closing, args), true);
			} else if (isUnaryPostfix(token) && allowCalls) {
				return new asn.UnaryPostfixNode(getTokenAndAdvance(), expr);
			} else {
				return expr;
			}
		},

		opExpr= function(lhs, minPrecedence) {
			var
			op= token.type===tOperator && token,
			precedence= op && getPrecedence(op.value);
			if (precedence && precedence > minPrecedence) {
				var rhs= (next() && opExpr(atomExpr(true), precedence));
				return opExpr(new asn.BinaryOpNode(lhs, op, rhs), minPrecedence);
			} else {
				return lhs;
			}
		},

		maybeConditional= function() {
			var expr= opExpr(atomExpr(true), 0);
			return token.opEq("?") ? new asn.ConditionalNode(expr, next(), maybeAssign(), expectPunc(":"), maybeAssign()) : expr;
		},

		isAssignable= function(expr) {
			return expr.type===asn.NameNode || expr.type===asn.SubscriptNode || (expr.type===asn.BinaryOpNode && expr.op.eq(tPunc, "."));
		},

		maybeAssign= function() {
			var lhs= maybeConditional();
			if (isAssignment(token)) {
				if (isAssignable(lhs)) {
					return new asn.BinaryOpNode(lhs, getTokenAndAdvance(), maybeAssign());
				} else {
					throw token.unexpected("left-hand-side is not assignable");
				}
			} else {
				return lhs;
			}
		},

		expression= function(commas) {
			if (commas!==false) {
				commas= true;
			}
			var expr= maybeAssign();
			if (commas && token.puncEq(",")) {
				return new asn.BinaryOpNode(expr, getTokenAndAdvance(), expression());
			} else {
				return expr;
			}
		},

		//
		// statements and blocks
		//
		statement= function(allowCase) {
			var parse= parseProcs[token.type.value];
			if (parse) {
				return parse(allowCase);
			}
			throw token.unexpected();
		},

		simpleStatement= function() {
			return new asn.StatementNode(expression(), expectSemicolon());
		},

		block= function() {
			// on entry, token must be "{"
			var
			start= getTokenAndAdvance(),
			statements= [];
			while (!token.puncEq("}")) {
				statements.push(statement());
			}
			return new asn.BlockNode(start, statements, getTokenAndAdvance());
		},

		statements= [];

		next();
		while (token.type!==tEof) {
			statements.push(statement());
		}

		return new asn.RootNode(statements);
	}

	return parse;
});
