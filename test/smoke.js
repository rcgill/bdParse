function quickTest(){
	var x= someObj["some-prop"];
}

function labelNodeTest(){
	while(1){
		if(someCondition){
			break done;
		}
	}
	done: return;
}

function caseNodeTest(){
	switch(someSwitchExpr){
	case 1: g(); break;
	case 2: x = y; g(); break;
	default: h();
	}
}

function debuggerTest(){
	debugger;
}

function doTest(){
  do {
	  x = y;
  } while(x);
}

function returnTest(){
  return;
  return x + y;
}

function throwTest(){
  throw x;
}

function varTest(){
  var x;
  var x, y;
  var x = 1;
  var x = 1, y = 2;
  var x = y = 1;
}

function whileTest(){
	while(1){
		f();
	}
	while(1){}
	while(1);
}

function withTest(){
	with(x){
		y = 7;
	}
}

function statementTest(){
	x = 7;
	7;
	;
}

function breakContinueTest(){
	while(1){
		break;
		break done;
		continue;
		continue done;
	}
done: return;
}

function forInTest(){
	for(p in x){
		x[p] = 7;
	}
}

function forTest(){
	for(x = 0; x<length; x++){y = 7;}
	for(; x<length; x++){y = 7;}
	for(x = 0;; x++){y = 7;}
	for(x = 0; x<length;){y = 7;}
	for(x = 0;;){y = 7;}
	for(; x<length;){y = 7;}
	for(;;x++){y = 7;}
	for(;;){y = 7;}
	for(;;){}
	for(;;);
}

function functionTest(){
	var x = function(){
		return 1;
	};
	var y = function(a, b){
		return a + b;
	};
	function F(){
		return 1;
	};
	function G(a, b){
		return a + b;
	};
}

function parenthesizeTest(){
	x = (1);
	y = ((1));
}

function ifTest(){
	if(f()){
		x = true;
	}
	if(f()){
	}
	if(f()){
		x = true;
	}else{
		x = false;
	}
	if(f()){
	}else{
		x = false;
	}
	if(f()){
		x = true;
	}else{
	}
	if(f()){
	}else{
	}
}

function conditionalTest(){
	x ? y : z;
}

function tryTest(){
  try {
	  x = 1;
  }catch(e){
	  console.log(e);
  }finally{
	  console.log(e);
  }
}

function newTest(){
	x = new f;
	x = new f();
	x = new f(a, b, 1+2);
	x = new f.g;
	x = new f.g();
	x = new f.g(a, b, 1+2);
}

function opTest(){
	++x;
	--x;
	typeof x;
	delete x.y;
	!x;
	~x;
	-x;
	+x;

	x++;
	x--;
}

function subscriptTest(){
	x[1];
	x[a + b];
}

function objectTest(){
	return {
		x:1,
		"y":2,
		z:function(){return false;}
	};
}
