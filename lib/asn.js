define(["./types"], function(types){
	///
	// Defines constructors for all abstract syntax nodes (ASN)s.
	//
	// Abstract syntax node types attempt to follow a rational naming convention:
	//
	//   * all properties that are tokens end with the suffix "Token"
	//   * all properties that are arrays end with the suffix "List"
	//   * the property parent points back to the parent node in the AST
	//
	// A property is either a token, a list, or another ASN intance.
	//
	// Each ASN type includes the prototype property `type which points to the constructor.
	//
	// Each ASN type includes the prototype method `traverse` which has the following definition for
	// node type XNode:
	//
	// `code
	//
	// 	function(sause){
	//		sause.beforeX && sause.beforeX.call(this, sause);
	//		if("X" in sause){
	//			sause.X && sause.X.call(this, sause);
	//		}else{
	//			XNode.traverse(this, sause);
	//		}
	//		sause.afterX && sause.afterX.call(this, sause);
	//	}

	var sumLocations
		// for convenience
		= types.sumLocations,

		nodes
		// the collection of all nodes; each node will have its id property set to its
		// index in the nodes collection; consume the node at index zero so that no real
		// node has an id===0.
		 = ["unused"];

	function set(
		me,      //(ASN) the node to set
		args,    //(arguments) the arguments provided to a particular node constructor
		location //(location) the location in the source for this production
	){
		///
		// Sets the initial value for a new node
		me.nodeId = nodes.length;
		nodes.push(me);
		me.location= location;
		if(args){
			for(var arg, i = 0, end = args.length; i<end; i++){
				arg = args[i];
				if(arg){
					if(arg instanceof Array){
						arg.forEach(function(item){ item.parent = me; });
					}else{
						arg.parent = me;
					}
				}
			}
		}
	}

// TODOC: parameter comments out of date below

	function traverse(node, sause){
		node && node.traverse && node.traverse(sause);
	}

	function CommentNode(
		commentToken //(token (type: tLineComment or tBlockComment)
	){
		this.commentToken = commentToken;
		set(this, arguments, commentToken.location);
	}

	function LabelNode(
		labelToken, //(token (type:tName))
		statement   //(asn)
	){
		this.labelToken = labelToken;
		this.statement = statement;
		set(this, arguments,  sumLocations(labelToken, statement));
	}
	LabelNode.traverse = function(sause){
		traverse(this.statement, sause);
	};

	function BlockNode(
		leftBraceToken, //(token (type:tPunc))
		statementList,   //(array of asn)
		rightBraceToken  //(token (type:tPunc))
	){
		this.leftBraceToken = leftBraceToken;
		this.statementList = statementList;
		this.rightBraceToken = rightBraceToken;
		set(this, arguments, sumLocations(leftBraceToken, rightBraceToken));
	}
	BlockNode.traverse = function(sause){
		this.statementList.forEach(function(statement){
			traverse(statement, sause);
		});
	};

	function SwitchNode(
		switchToken,     //(token (type:tKeyword, value:"switch"))
		leftBraceToken,  //(token (type:tPunc, value:"{")
		switchExpr,      //(asn)
		rightBraceToken, //(token (type:tPunc, value:"}")
		caseList         //(array of asn)
	){
		this.switchToken = switchToken;
		this.leftBraceToken = leftBraceToken;
		this.switchExpr = switchExpr;
		this.rightBraceToken = rightBraceToken;
		this.caseList = caseList;
		set(this, arguments, sumLocations(switchToken, rightBraceToken));
	}
	SwitchNode.traverse = function(sause){
		this.switchExpr.traverse(sause);
		this.caseList.forEach(function(caseItem){ traverse(caseItem, sause); });
	};

	function CaseNode(
		caseToken,  //(token (type:tKeyword, value:"case")
		expr, //(asn)
		colonToken  //(token (type:tPunc, value:":")
	){
		this.caseToken = caseToken;
		this.expr = expr;
		this.colonToken = colonToken;
		set(this, arguments, sumLocations(caseToken, colonToken));
	}
	CaseNode.traverse = function(sause){
		traverse(this.expr, sause);
	};

	function DefaultNode(
		defaultToken, //(token (type:tKeyword, value:"default"))
		colonToken    //(token type:tPunc, value:":"))
	){
		this.defaultToken = defaultToken;
		this.colonToken = colonToken;
		set(this, arguments, sumLocations(defaultToken, colonToken));
	}

	function DebuggerNode(
		debuggerToken, //(token (type:tKeyword, value:"debugger"))
		semicolonToken //(token type:tPunc, value:";"))
	){
		this.debuggerToken = debuggerToken;
		this.semicolonToken = semicolonToken;
		set(this, arguments, sumLocations(debuggerToken, semicolonToken || debuggerToken));
	}

	function DoNode(
		doToken,       //(token (type:tKeyword, value:"switch"))
		statement,          //(asn)
		whileToken,    //(token)
		condition,     //(asn)
		semicolonToken //(token (type:tPunc, value:";")
	){
		this.doToken = doToken;
		this.statement = statement;
		this.whileToken = whileToken;
		this.condition = condition;
		this.semicolonToken = semicolonToken;
		set(this, arguments, sumLocations(doToken, semicolonToken || condition));
	}
	DoNode.traverse = function(sause){
		traverse(this.statement, sause);
		traverse(this.condition, sause);
	};

	function ReturnNode(
		returnToken,   //(token (type:tKeyword, value:"switch"))
		expr,    //(asn or 0)
		semicolonToken //(token (type:tPunc, value:";") or 0)
	){
		this.returnToken = returnToken;
		this.expr = expr;
		this.semicolonToken = semicolonToken;
		set(this, arguments, sumLocations(returnToken, semicolonToken || expr || returnToken));
	}
	ReturnNode.traverse = function(sause){
		traverse(this.expr, sause);
	};

	function ThrowNode(
		throwToken,    //(token (type:tKeyword, value:"switch"))
		expr,     //(asn)
		semicolonToken //(token (type:tPunc, value:";"))
	){
		this.throwToken = throwToken;
		this.expr = expr;
		this.semicolonToken = semicolonToken;
		set(this, arguments, sumLocations(throwToken, semicolonToken || expr));
	}
	ThrowNode.traverse = function(sause){
		traverse(this.expr, sause);
	};


	function LexicalVariableNode(
		nameToken,
		assignToken,
		initialValue,
		commaToken
	){
		this.nameToken = nameToken;
		this.assignToken = assignToken;
		this.initialValue = initialValue;
		this.commaToken = commaToken;
		set(this, arguments, sumLocations(nameToken, commaToken || initialValue || nameToken));
	}
	LexicalVariableNode.traverse = function(sause){
		traverse(this.initialValue, sause);
	};

	function VarNode(
		varToken,      //(token (type:tKeyword, value:"switch"))
		varList,       //(array of asn)
		semicolonToken //(token (type:tPunc, value:";")
	){
		// varList is a vector of [name, expr]; name is a token, expr is an expr or nil
		this.varToken = varToken;
		this.varList = varList;
		this.semicolonToken = semicolonToken;
		set(this, arguments, sumLocations(varToken, semicolonToken || types.back(varList)));
	}
	VarNode.traverse = function(sause){
		this.varList.forEach(function(def){
			traverse(def.initialValue, sause);
		});
	};

	function WhileNode(
		whileToken,     //(token (type:tKeyword, value:"while"))
		condition, //(asn)
		statement  //(asn)
	){
		this.whileToken = whileToken;
		this.condition = condition;
		this.statement = statement;
		set(this, arguments, sumLocations(whileToken, statement || condition));
	}
	WhileNode.traverse = function(sause){
		traverse(this.condition, sause);
		traverse(this.statement, sause);
	};

	function WithNode(
		withToken,    //(token (type:tKeyword, value:"with"))
		expr,     //(asn)
		statement //(asn)
	){
		this.withToken = withToken;
		this.expr = expr;
		this.statement = statement;
		set(this, arguments, sumLocations(withToken, statement || expr));
	}
	WithNode.traverse = function(sause){
		traverse(this.expr, sause);
		traverse(this.statement, sause);
	};

	function StatementNode(
		expr,    //(asn)
		semicolonToken //(token (type:tPunc, value:";")
	){
		this.expr = expr;
		this.semicolonToken = semicolonToken;
		set(this, arguments, sumLocations(expr || semicolonToken, semicolonToken || expr));
	}
	StatementNode.traverse = function(sause){
		traverse(this.expr, sause);
	};

	function BreakNode(
		breakToken,    //(token (type:tKeyword, value:"break"))
		nameToken,     //(token (type:tName) or 0)
		semicolonToken //(token (type:tPunc, value:";")
	){
		this.breakToken = breakToken;
		this.nameToken = nameToken;
		this.semicolonToken = semicolonToken;
		set(this, arguments, sumLocations(breakToken, semicolonToken || nameToken || breakToken));
	}

	function ContinueNode(
		continueToken, //(token (type:tKeyword, value:"switch"))
		nameToken,     //(token (type:tName) or 0)
		semicolonToken //(token (type:tPunc, value:";")
	){
		this.continueToken = continueToken;
		this.nameToken = nameToken;
		this.semicolonToken = semicolonToken;
		set(this, arguments, sumLocations(continueToken, semicolonToken || nameToken || continueToken), nameToken);
	}

	function ForInNode(
		forToken,     //(token (type:tKeyword, value:"for"))
		leftParenToken,    //(token (type:tpunc, value:"("))
		varToken,     //(token (type:tKeyword, value:"var"))
		varNameToken, //(token (type:tName))
		inToken,      //(token (type:tKeyword, value:"in"))
		object,       //(asn)
		rightParenToken,   //(token (type:tpunc, value:")"))
		statement     //(asn)
	){
		this.forToken = forToken;
		this.leftParenToken = leftParenToken;
		this.varToken = varToken;
		this.varNameToken = varNameToken;
		this.inToken = inToken;
		this.object = object;
		this.rightParenToken = rightParenToken;
		this.statement = statement;
		set(this, arguments, sumLocations(forToken, statement || rightParenToken));
	}
	ForInNode.traverse = function(sause){
		traverse(this.object, sause);
		traverse(this.statement, sause);
	};


	function ForNode(
		forToken,       //(token (type:tKeyword, value:"for"))
		leftParenToken,    //(token (type:tpunc, value:"("))
		varToken,       //(token (type:tKeyword, value:"var"))
		init,           //([asn or 0, token (type:tPunc, value:";") or 0])
		test,           //([asn or 0, token (type:tPunc, value:";") or 0])
		step,           //(asn or 0)
		rightParenToken,   //(token (type:tpunc, value:")"))
		statement      //(asn)
	){
		this.forToken = forToken;
		this.leftParenToken = leftParenToken;
		this.varToken = varToken;
		this.init = init;
		this.test = test;
		this.step = step;
		this.rightParenToken = rightParenToken;
		this.statement = statement;
		set(this, arguments, sumLocations(forToken, statement || rightParenToken));
	}
	ForNode.traverse = function(sause){
		traverse(this.init, sause);
		traverse(this.test, sause);
		traverse(this.step, sause);
		traverse(this.statement, sause);
	};

	function FunctionDefNode(
		functionToken, //(token (type:tKeyword, value:"function"))
		nameToken,     //(token (type:tName))
		leftParenToken,     //(token (type:tpunc, value:"("))
		parameterList, //(array of token (type:tName))
		rightParenToken,    //(token (type:tpunc, value:")"))
		body          //(asn.BodyNode)
	){
		this.functionToken = functionToken;
		this.nameToken = nameToken;
		this.leftParenToken = leftParenToken;
		this.parameterList = parameterList;
		this.rightParenToken = rightParenToken;
		this.body = body;
		set(this, arguments, sumLocations(functionToken, body));
	}
	FunctionDefNode.traverse = function(sause){
		traverse(this.body, sause);
	};

	function FunctionLiteralNode(
		functionToken, //(token (type:tKeyword, value:"function"))
		nameToken,     //(token (type:tName))
		leftParenToken,     //(token (type:tpunc, value:"("))
		parameterList, //(array of token (type:tName))
		rightParenToken,    //(token (type:tpunc, value:")"))
		body          //(asn.BodyNode)
	){
		FunctionDefNode.call(this, functionToken, nameToken, leftParenToken, parameterList, rightParenToken, body);
	}
	FunctionLiteralNode.traverse = function(sause){
		traverse(this.body, sause);
	};

	function ParenthesizedNode(
		leftParenToken,     //(token (type:tpunc, value:"("))
		expr, //(array of token (type:tName))
		rightParenToken    //(token (type:tpunc, value:")"))
	){
		this.leftParenToken = leftParenToken;
		this.expr = expr;
		this.rightParenToken = rightParenToken;
		set(this, arguments, sumLocations(leftParenToken, rightParenToken));
	}
	ParenthesizedNode.traverse = function(sause){
		traverse(this.expr, sause);
	};

	function IfNode(
		ifToken,       //(token (type:tKeyword, value:"if"))
		condition,     //(asn)
		trueStatement, //(asn)
		elseToken,     //(token (type:tKeyword, value:"else") or 0)
		falseStatement //(asn or 0)
	){
		this.ifToken = ifToken;
		this.condition = condition;
		this.trueStatement = trueStatement;
		this.elseToken = elseToken;
		this.falseStatement = falseStatement;
		set(this, arguments, sumLocations(ifToken, falseStatement || elseToken || trueStatement));
	}
	IfNode.traverse = function(sause){
		traverse(this.condition, sause);
		traverse(this.trueStatement, sause);
		traverse(this.falseStatement, sause);
	};

	function ConditionalNode(
		condition,//(asn)
		questionToken,
		trueExpr, //(asn)
		colonToken,
		falseExpr //(asn)
	){
		this.condition = condition;
		this.questionToken = questionToken;
		this.trueExpr = trueExpr;
		this.colonToken = colonToken;
		this.falseExpr = falseExpr;
		set(this, arguments, sumLocations(condition, falseExpr));
	}
	ConditionalNode.traverse = function(sause){
		traverse(this.condition, sause);
		traverse(this.trueExpr, sause);
		traverse(this.falseExpr, sause);
	};

	function TryNode(
		tryToken,        //(token (type:tKeyword, value:"switch"))
		body,            //(asn)
		catchToken,
		leftParenToken,
		catchNameToken,  //(token (type:tName))
		rightParenToken,
		catchStatement,  //(asn)
		finallyToken,
		finallyStatement //(asn)
	){
		this.tryToken = tryToken;
		this.body = body;
		this.catchToken = catchToken;
		this.leftParenToken = leftParenToken;
		this.catchNameToken = catchNameToken;
		this.rightParenToken = rightParenToken;
		this.catchStatement = catchStatement;
		this.finallyToken = finallyToken;
		this.finallyStatement = finallyStatement;
		set(this, arguments, sumLocations(tryToken, finallyStatement || catchStatement));
	}
	TryNode.traverse = function(sause){
		traverse(this.body, sause);
		traverse(this.catchStatement, sause);
		traverse(this.finallyStatement, sause);
	};

	function ExprListNode(
		leftParenToken,
		exprList,     //(array of asn)
		rightParenToken
	){
		this.leftParenToken = leftParenToken;
		this.exprList = exprList;
		this.rightParenToken = rightParenToken;
		set(this, arguments, sumLocations(leftParenToken, rightParenToken));
	}
	ExprListNode.traverse = function(sause){
		this.exprList.forEach(function(expr){ traverse(expr, sause); });
	};

	function NewNode(
		newToken,  //(token (type:tKeyword, value:"new"))
		expr,   //(asn)
		argList       //(array of asn or 0)
	){
		this.newToken = newToken;
		this.expr = expr;
		this.argList = argList;
		set(this, arguments, sumLocations(newToken, argList || expr));
	}
	NewNode.traverse = function(sause){
		traverse(this.expr, sause);
		this.argList && this.argList.forEach(function(arg){ traverse(arg, sause); });
	};

	function UnaryPrefixNode(
		opToken,   //(token (type:tOperator))
		expr  //(asn)
	){
		this.opToken = opToken;
		this.expr = expr;
		set(this, arguments, sumLocations(opToken, expr));
	}
	UnaryPrefixNode.traverse = function(sause){
		traverse(this.expr, sause);
	};

	function UnaryPostfixNode(
		opToken,   //(token (type:tOperator))
		expr  //(asn)
	){
		this.opToken = opToken;
		this.expr = expr;
		set(this, arguments, sumLocations(expr, opToken));
	}
	UnaryPostfixNode.traverse = function(sause){
		traverse(this.expr, sause);
	};

	function BinaryOpNode(
		lhs, //(asn)
		opToken,  //(token (type:tOperator))
		rhs  //(asn)
	){
		this.lhs = lhs;
		this.opToken = opToken;
		this.rhs = rhs;
		set(this, arguments, sumLocations(lhs, rhs));
	}
	BinaryOpNode.traverse = function(sause){
		traverse(this.lhs, sause);
		traverse(this.rhs, sause);
	};

	function ApplicationNode(
		funcExpr,     //(asn) a function expresion
		leftParenToken, //(token) type:tPunc, value:"("
		argList,          //(array of asn) the arguments
		rightParenToken //(token) type:tPunc, value:")"
	){
		this.funcExpr = funcExpr;
		this.leftParenToken = leftParenToken;
		this.argList = argList;
		this.rightParenToken = rightParenToken;
		set(this, arguments, sumLocations(funcExpr, rightParenToken));
	}
	ApplicationNode.traverse = function(sause){
		traverse(this.funcExpr, sause);
		this.argList && this.argList.forEach(function(arg){ traverse(arg, sause); });
	};

	function SubscriptNode(
		lhs,     //(asn)
		leftBracketToken, //(token) type:tPunc, value:"["
		arg,          //(array of asn) the argument
		rightBracketToken //(token) type:tPunc, value:"]"
	){
		this.lhs = lhs;
		this.leftBracketToken = leftBracketToken;
		this.arg = arg;
		this.rightBracketToken = rightBracketToken;
		set(this, arguments, sumLocations(lhs, rightBracketToken));
	}
	SubscriptNode.traverse = function(sause){
		traverse(this.arg, sause);
	};

	function ArrayNode(
		leftBracketToken, //(token (type:tPunc, value:"[")
		exprList,       //(array of asn)
		rightBracketToken   //(token (type:tPunc, value:"]")
	){
		this.leftBracketToken = leftBracketToken;
		this.exprList = exprList;
		this.rightBracketToken = rightBracketToken;
		set(this, arguments, sumLocations(leftBracketToken, rightBracketToken));
	}
	ArrayNode.traverse = function(sause){
		this.exprList.forEach(function(expr){ traverse(expr, sause); });
	};


	function PropertyNode(
		nameToken,
		colonToken,
		initialValue,
		commaToken
	){
		this.nameToken = nameToken;
		this.colonToken = colonToken;
		this.initialValue = initialValue;
		this.commaToken = commaToken;
		set(this, arguments, sumLocations(nameToken, commaToken || initialValue));
	}
	PropertyNode.traverse = function(sause){
		traverse(this.initialValue, sause);
	};


	function ObjectNode(
		leftBraceToken, //(token (type:tPunc, value:"}")
		propertyList, //(array of asn.PropertyNode
		rightBraceToken  //(token (type:tPunc, value:"}")
	){
		this.leftBraceToken = leftBraceToken;
		this.propertyList = propertyList;
		this.rightBraceToken = rightBraceToken;
		set(this, arguments, sumLocations(leftBraceToken, rightBraceToken), propertyList, leftBraceToken.comment);
	}
	ObjectNode.traverse = function(sause){
		this.propertyList.forEach(function(property){ traverse(property[2], sause); });
	};

	function NameNode(
		token //(token (type:tName))
	){
		this.token = token;
		set(this, arguments, token.location, token);
	}

	function NumberNode(
		token //(token (type:tNumber))
	){
		this.token = token;
		set(this, arguments, token.location, token);
	}

	function StringNode(
		token //(token (type:tString))
	){
		this.token = token;
		set(this, arguments, token.location, token);
	}

	function RegExNode(
		token //(token (type:tRegEx))
	){
		this.token = token;
		set(this, arguments, token.location, token);
	}

	var symbols= types.symbols,
		tNumber= symbols["tNumber"],
		tString= symbols["tString"],
		tRegEx= symbols["tRegEx"],
		tName= symbols["tName"];

	function AtomNode(
		token //(token (type: tName or tNumber or tString or tRegEx))
	){
		switch (token.type){
			case tName:   return new NameNode(token);
			case tNumber: return new NumberNode(token);
			case tString: return new StringNode(token);
			case tRegEx:  return new RegExNode(token);
		}
		throw token.unexpected();
	}

	function RootNode(
		statementList //(array of asn)
	){
		this.statementList = statementList;
		var start= statementList[0] || new types.location(0, 0, 0, 0),
			end= types.back(statementList) || start;
		set(this, arguments, sumLocations(start, end), statementList);
	}
	RootNode.traverse = function(sause){
		this.statementList.forEach(function(statement){ traverse(statement, sause); });
	};

	var result = {
		CommentNode:CommentNode,
		LabelNode:LabelNode,
		BlockNode:BlockNode,
		SwitchNode:SwitchNode,
		CaseNode:CaseNode,
		DefaultNode:DefaultNode,
		DebuggerNode:DebuggerNode,
		DoNode:DoNode,
		ReturnNode:ReturnNode,
		ThrowNode:ThrowNode,
		LexicalVariableNode:LexicalVariableNode,
		VarNode:VarNode,
		WhileNode:WhileNode,
		WithNode:WithNode,
		StatementNode:StatementNode,
		BreakNode:BreakNode,
		ContinueNode:ContinueNode,
		ForInNode:ForInNode,
		ForNode:ForNode,
		FunctionDefNode:FunctionDefNode,
		FunctionLiteralNode:FunctionLiteralNode,
		ParenthesizedNode:ParenthesizedNode,
		IfNode:IfNode,
		ConditionalNode:ConditionalNode,
		TryNode:TryNode,
		ExprListNode:ExprListNode,
		NewNode:NewNode,
		UnaryPrefixNode:UnaryPrefixNode,
		UnaryPostfixNode:UnaryPostfixNode,
		BinaryOpNode:BinaryOpNode,
		ApplicationNode:ApplicationNode,
		SubscriptNode:SubscriptNode,
		ArrayNode:ArrayNode,
		PropertyNode:PropertyNode,
		ObjectNode:ObjectNode,
		NameNode:NameNode,
		NumberNode:NumberNode,
		StringNode:StringNode,
		RegExNode:RegExNode,
		AtomNode:AtomNode,
		RootNode:RootNode
	};

	//
	// Add a prototype to each node constructor that includes a standard traverse function and type property that looks like this...
	//
	//CommentNode.prototype = {
	//	traverse:function(sause){
	//		sause.beforeComment && sause.beforeComment.call(this, sause);
	//		if("Comment" in sause){
	//			sause.Comment && sause.Comment.call(this, sause);
	//		}else{
	//			CommentNode.traverse(this, sause);
	//		}
	//		sause.afterComment && sause.afterComment.call(this, sause);
	//	},
	//  type:CommentNode
	//};
	var pattern = "$Node.prototype = {" +
		"traverse:function(sause){" +
			"sause.before$ && sause.before$.call(this, sause);" +
			"if('$' in sause){" +
				"sause.$ && sause.$.call(this, sause);" +
			"}else if($Node.traverse){" +
				"$Node.traverse.call(this, sause);" +
			"}" +
			"sause.after$ && sause.after$.call(this, sause);" +
		"}," +
		"type:$Node" +
		"};";
	for(var p in result) {
		var name = p.substring(0, p.length - 4);
		eval(pattern.replace(/\$/g, name));
	}

	result.replaceNode = function(
		oldNode, //(any, child of an asn) The node to be replaced
		newNode  //(any, childe of an asn) The replacement node
	){
		///
		// Replaces oldNode in oldNode.parent with newNode.

		var parent = newNode.parent = oldNode.parent,
			candidate;
		if(parent){
			for(var p in parent){
				candidate = parent[p];
				if(candidate===oldNode){
					parent[p] = newNode;
					return candidate;
				}else if(candidate instanceof Array){
					for(var result, i = 0, end = candidate.length; i<end; i++){
						if(candidate[i]===oldNode){
							result = candidate[i];
							candidate[i] = newNode;
							return result;
						}
					}
				}
			}
		}
		return 0;
	};

	return result;
});

