define(["./types"], function(types){
	///
	// Defines constrictprs for all abstract syntax nodes (ASN)s.

	var sumLocations= types.sumLocations;

	var nodeId = 0;
	function set(
		me,
		args,
		location //(location) the location in the source for this production
	){
		me.nodeId = ++nodeId;
		me.location= location;
		if(args){
			for(var i = 0, end = args.length; i<end; i++){
				if(args[i]){
					args[i].parent = me;
				}
			}
		}
	}

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
		statements,   //(array of asn)
		rightBraceToken  //(token (type:tPunc))
	){
		this.leftBraceToken = leftBraceToken;
		this.statements = statements;
		this.rightBraceToken = rightBraceToken;
		set(this, 0, sumLocations(leftBraceToken, rightBraceToken));
		statements.forEach(function(statement){ statement.parent= this; });
	}
	BlockNode.traverse = function(sause){
		this.statements.forEach(function(statement){
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
		caseList.forEach(function(caseItem){ caseItem.parent= this; });
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
		body,          //(asn)
		whileToken,    //(token)
		condition,     //(asn)
		semicolonToken //(token (type:tPunc, value:";")
	){
		this.doToken = doToken;
		this.body = body;
		this.whileToken = whileToken;
		this.condition = condition;
		this.semicolonToken = semicolonToken;
		set(this, arguments, sumLocations(doToken, semicolonToken || condition));
	}
	DoNode.traverse = function(sause){
		traverse(this.body, sause);
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

	function VarNode(
		varToken,      //(token (type:tKeyword, value:"switch"))
		varDefs,       //(array of lexicalVariable)
		semicolonToken //(token (type:tPunc, value:";")
	){
		// varDefs is a vector of [name, expr]; name is a token, expr is an expr or nil
		this.varToken = varToken;
		this.varDefs = varDefs;
		this.semicolonToken = semicolonToken;
		set(this, 0, sumLocations(varToken, semicolonToken || types.back(varDefs)));
		var me = this;
		varDefs.forEach(function(def){
			if(def.initalValue){
				def.initialValue.parent = me;
			}
		});
	}
	VarNode.traverse = function(sause){
		this.varDefs.forEach(function(def){
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
		leftBrace,     //(token (type:tpunc, value:"{"))
		body,          //(array of asn)
		rightBrace     //(token (type:tPunc, value:"}") or 0)
	){
		this.functionToken = functionToken;
		this.nameToken = nameToken;
		this.leftParenToken = leftParenToken;
		this.parameterList = parameterList;
		this.rightParenToken = rightParenToken;
		this.leftBrace = leftBrace;
		this.body = body;
		this.rightBrace = rightBrace;
		set(this, arguments, sumLocations(functionToken, rightBrace));
		body.forEach(function(statement){ statement.parent= this; });
	}
	FunctionDefNode.traverse = function(sause){
		this.body.forEach(function(statement){ traverse(statement, sause); });
	};

	function FunctionLiteralNode(
		functionToken, //(token (type:tKeyword, value:"function"))
		nameToken,     //(token (type:tName))
		leftParenToken,     //(token (type:tpunc, value:"("))
		parameterList, //(array of token (type:tName))
		rightParenToken,    //(token (type:tpunc, value:")"))
		leftBrace,     //(token (type:tpunc, value:"{"))
		body,          //(array of asn)
		rightBrace     //(token (type:tPunc, value:"}") or 0)
	){
		this.functionToken = functionToken;
		this.nameToken = nameToken;
		this.leftParenToken = leftParenToken;
		this.parameterList = parameterList;
		this.rightParenToken = rightParenToken;
		this.leftBrace = leftBrace;
		this.body = body;
		this.rightBrace = rightBrace;
		set(this, arguments, sumLocations(functionToken, rightBrace));
		body.forEach(function(statement){ statement.parent= this; });
	}
	FunctionLiteralNode.traverse = function(sause){
		this.body.forEach(function(statement){ traverse(statement, sause); });
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
		exprList.forEach(function(expr){ expr.parent= this; });
	}
	ExprListNode.traverse = function(sause){
		this.exprList.forEach(function(expr){ traverse(expr, sause); });
	};

	function NewNode(
		newToken,  //(token (type:tKeyword, value:"new"))
		expr,   //(asn)
		args       //(array of asn or 0)
	){
		this.newToken = newToken;
		this.expr = expr;
		this.args = args;
		set(this, arguments, sumLocations(newToken, args || expr));
		args && args.forEach(function(arg){ arg.parent= this; });
	}
	NewNode.traverse = function(sause){
		traverse(this.expr, sause);
		this.args && this.args.forEach(function(arg){ traverse(arg, sause); });
	};

	function UnaryPrefixNode(
		op,   //(token (type:tOperator))
		expr  //(asn)
	){
		this.op = op;
		this.expr = expr;
		set(this, arguments, sumLocations(op, expr));
	}
	UnaryPrefixNode.traverse = function(sause){
		traverse(this.expr, sause);
	};

	function UnaryPostfixNode(
		op,   //(token (type:tOperator))
		expr  //(asn)
	){
		this.op = op;
		this.expr = expr;
		set(this, arguments, sumLocations(expr, op));
	}
	UnaryPostfixNode.traverse = function(sause){
		traverse(this.expr, sause);
	};

	function BinaryOpNode(
		lhs, //(asn)
		op,  //(token (type:tOperator))
		rhs  //(asn)
	){
		this.lhs = lhs;
		this.op = op;
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
		rightParenToken, //(token) type:tPunc, value:")"
		args          //(array of asn) the arguments
	){
		this.funcExpr = funcExpr;
		this.leftParenToken = leftParenToken;
		this.rightParenToken = rightParenToken;
		this.args = args;
		set(this, arguments, sumLocations(funcExpr, rightParenToken));
		args && args.forEach(function(arg){ arg.parent= this; });
	}
	ApplicationNode.traverse = function(sause){
		traverse(this.funcExpr, sause);
		this.args && this.args.forEach(function(arg){ traverse(arg, sause); });
	};

	function SubscriptNode(
		lhs,     //(asn)
		leftBracket, //(token) type:tPunc, value:"["
		arg,          //(array of asn) the argument
		rightBracket //(token) type:tPunc, value:"]"
	){
		this.lhs = lhs;
		this.leftBracket = leftBracket;
		this.arg = arg;
		this.rightBracket = rightBracket;
		set(this, arguments, sumLocations(lhs, rightBracket));
	}
	SubscriptNode.traverse = function(sause){
		traverse(this.arg, sause);
	};

	function ArrayNode(
		leftBracket, //(token (type:tPunc, value:"[")
		exprList,       //(array of asn)
		rightBacket   //(token (type:tPunc, value:"]")
	){
		this.leftBracket = leftBracket;
		this.exprList = exprList;
		this.rightBacket = rightBacket;
		set(this, arguments, sumLocations(leftBracket, rightBacket));
		exprList.forEach(function(expr){ expr.parent= this; });
	}
	ArrayNode.traverse = function(sause){
		this.exprList.forEach(function(expr){ traverse(expr, sause); });
	};

	function ObjectNode(
		leftBraceToken, //(token (type:tPunc, value:"}")
		propertyList, //(array or [token (type:tName), asn] pairs)
		rightBraceToken  //(token (type:tPunc, value:"}")
	){
		this.leftBraceToken = leftBraceToken;
		this.propertyList = propertyList;
		this.rightBraceToken = rightBraceToken;
		set(this, arguments, sumLocations(leftBraceToken, rightBraceToken), propertyList, leftBraceToken.comment);
		propertyList.forEach(function(property){ property[2].parent= this; });
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
		statements //(array of asn)
	){
		this.statements = statements;
		var start= statements[0] || new types.location(0, 0, 0, 0),
			end= types.back(statements) || start;
		set(this, arguments, sumLocations(start, end), statements);
		statements.forEach(function(statement){ statement.parent= this; });
	}
	RootNode.traverse = function(sause){
		this.statements.forEach(function(statement){ traverse(statement, sause); });
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
	//		if("asnComment" in sause){
	//			sause.asnComment && sause.asnComment.call(this, sause);
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

	return result;
});

