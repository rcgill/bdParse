define(function(){
	///
	// An API that provides sause to dump an abstract syntax tree into a human-readable text.

	var spaceCount = 0,
		spaces = "          ";
	while(spaces.length<200) spaces += spaces;

	var output;

	function writelnToken(t){
		output += spaces.substring(0, spaceCount) + t.type.value + ":" + t.value + "\n";
	}

	function writeln(t){
		output += spaces.substring(0, spaceCount) + t + "\n";
	}

	function traverse(node, sause){
		node && node.traverse && node.traverse(sause);
	}

	var sause = {
		beforeComment:function(){
			writelnToken(this.commentToken);
		},

		beforeLabel:function(){
			writeln("label:" + this.labelToken.value);
		},

		beforeBlock:function(){
			writeln("block");
		},

		Switch:function(sause){
			writeln("switch");
			spaceCount += 2;
			this.switchExpr.traverse(sause);
			this.caseList.forEach(function(caseItem){
				caseItem.traverse(sause);
			});
			spaceCount -= 2;
			writeln("end of switch");
		},

		Case:function(){
			writeln("case:");
			spaceCount += 2;
			traverse(this.expr, sause);
			spaceCount -= 2;
		},

		beforeDefault:function(){
			writeln("default");
		},

		beforeDebugger:function(){
			writeln("debugger");
		},

		Do:function(sause){
			writeln("do");
			spaceCount += 2;
			writeln("body:");
			this.body.traverse(sause);
			writeln("condition:");
			this.condition.traverse(sause);
			spaceCount -= 2;
		},

		beforeReturn:function(){
			writeln("return " + (this.expr && this.expr.traverse ? "" : this.expr && this.expr.value));
		},

		beforeThrow:function(){
			writeln("throw");
		},

		Var:function(sause){
			writeln("var");
			spaceCount += 2;
			this.varDefs.forEach(function(def){
				writeln(def.name.value);
				def.initialValue && def.initialValue.traverse(sause);
			});
			writeln("end of vars");
			spaceCount -= 2;
		},

		While:function(sause){
			writeln("while");
			spaceCount += 2;
			writeln("condition");
			traverse(this.condition, sause);
			writeln("statement");
			traverse(this.statement, sause);
			spaceCount -= 2;
		},

		With:function(sause){
			writeln("with");
			spaceCount += 2;
			writeln("expr");
			traverse(this.expr, sause);
			writeln("statement");
			traverse(this.statement, sause);
			spaceCount -= 2;
		},

		//beforeStatement: just press on to the expr

		beforeBreak:function(){
			writeln("break" + (this.nameToken ? ":" + this.nameToken.value : ""));
		},

		beforeContinue:function(){
			writeln("continue" + (this.nameToken ? ":" + this.nameToken.value : ""));
		},

		ForIn:function(sause){
			writeln("for-in");
			spaceCount += 2;
			writeln("object:");
			traverse(this.object, sause);
			writeln("statement:");
			traverse(this.statement, sause);
			spaceCount -= 2;
		},

		For:function(sause){
			writeln("for");
			spaceCount += 2;
			writeln("init:");
			traverse(this.init, sause);
			writeln("test:");
			traverse(this.test, sause);
			writeln("step:");
			traverse(this.step, sause);
			writeln("statement:");
			traverse(this.statement, sause);
			spaceCount -= 2;
		},

		beforeFunctionDef:function(){
			writeln("function-def " + (this.nameToken ? this.nameToken.value : "anon") + "(" + this.parameterList.map(function(item){ return item.value; }).join(",") + ")");
		},

		beforeFunctionLiteral:function(){
			writeln("function-def " + (this.nameToken ? this.nameToken.value : "anon") + "(" + this.parameterList.map(function(item){ return item.value; }).join(",") + ")");
		},

		//beforeParenthesized: just press on to the expr

		If:function(sause){
			writeln("if");
			spaceCount += 2;
			writeln("condition");
			traverse(this.condition, sause);
			writeln("true statement");
			traverse(this.trueStatement, sause);
			writeln("false statement");
			traverse(this.falseStatement, sause);
			spaceCount -= 2;
		},

		Conditional:function(sause){
			writeln("conditional");
			spaceCount += 2;
			writeln("condition");
			traverse(this.condition, sause);
			writeln("true statement");
			traverse(this.trueExpr, sause);
			writeln("false statement");
			traverse(this.falseExpr, sause);
			spaceCount -= 2;
		},

		Try:function(sause){
			writeln("try");
			spaceCount += 2;
			writeln("body");
			traverse(this.body, sause);
			if(this.catchToken){
				writeln("catch(" + this.catchNameToken.value + ")");
				traverse(this.catchStatement, sause);
			}
			if(this.finallyStatement){
				writeln("finally");
				traverse(this.finallyStatement, sause);
				spaceCount -= 2;
			}
		},

		ExprList:function(sause){
			writeln("expression list");
			spaceCount += 2;
			this.exprList.forEach(function(item){
				writeln("item");
				traverse(item, sause);
			});
			writeln("end of items");
			spaceCount -= 2;
		},

		New:function(sause){
			writeln("new");
			spaceCount += 2;
			writeln("expr");
			traverse(this.expr, sause);
			if(this.args){
				writeln("args");
				this.args.forEach(function(arg){
					writeln("item");
					traverse(item, sause);
				});
			}
			writeln("end of args");
			spaceCount -= 2;
		},

		beforeUnaryPrefix:function(){
			writeln("unary prefix op = " + this.op.value);
		},

		beforeUnaryPostfix:function(){
			writeln("unary postfix op = " + this.op.value);
		},

		BinaryOp:function(sause){
			writeln("binary op:" + this.op.value);
			spaceCount += 2;
			writeln("lhs");
			traverse(this.lhs, sause);
			writeln("rhs");
			traverse(this.rhs, sause);
			spaceCount -= 2;
		},

		Application:function(sause){
			writeln("application");
			spaceCount += 2;
			writeln("function");
			traverse(this.funcExpr, sause);
			this.args.forEach(function(arg){
				writeln("arg");
				traverse(arg, sause);
			});
			writeln("end of args");
			spaceCount -= 2;
		},

		beforeSubscript:function(){
			writeln("subscript");
		},

		Array:function(sause){
			writeln("array");
			spaceCount += 2;
			this.args.forEach(function(arg){
				writeln("arg");
				traverse(arg, sause);
			});
			writeln("end of args");
			spaceCount -= 2;
		},

		Object:function(sause){
			writeln("object");
			spaceCount += 2;
			this.propertyList.forEach(function(item){
				writeln(item[0].value);
				spaceCount += 2;
				traverse(item[2], sause);
				spaceCount -= 2;
			});
			writeln("end of props");
			spaceCount -= 2;
		},

		beforeName:function(){
			writelnToken(this.token);
		},

		beforeNumber:function(){
			writelnToken(this.token);
		},

		beforeString:function(){
			writelnToken(this.token);
		},

		beforeRegEx:function(){
			writelnToken(this.token);
		},

		beforeAtom:function(){
			writeln("ERROR");
		},

		beforeRoot:function(){
			output = "";
		}
	};

	var afterNames = [];
	for(var p in sause){
		if(/^before/.test(p)){
			(function(f){
				sause[p] = function(){ f.call(this); spaceCount += 2; };
			})(sause[p]);
			afterNames.push("after" + p.substring(6));
		}
	}
	afterNames.forEach(function(name){
		sause[name] = function(){ spaceCount -= 2; };
	});

	return {
		sause:
			///
			// Sause to apply to an abstract syntax tree traversal that causes a human-readable representation
			// of the tree to be built.
			//
			// Applying sause to an abstract tree traversal builds up a human-readable representation
			// of the tree in a text string that may be accessed via `bdParse.dumpSause.getOutput`. For
			// example:
			//
			// `code
			// require(["bdParse", "bdParse/dumpSause"], function(parse, sause){
			//   var text = getSomeJavaScriptCodeText();
			//   parse.parseText(text)[1].traverse(sause.sause);
			//
			//   // the readable text is available at sause.getOutput();
			// 	 var readableRepresentation = sause.getOutput();
			sause,

		getOutput:function(){
			///
			// Returns the result of the last tree tranversed with sause.
			return output;
		}
	};
});
