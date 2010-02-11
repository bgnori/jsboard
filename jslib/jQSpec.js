/*
 * 
 * This file provids some supports (not all) for JSSpec style BDD on QUnit.
 * This is a hack, not work.
 * 
 */

function debug(){
  if (window['console']){
    console.log.apply(null, arguments);
  };
};


example = test;
function Subject(target){
  this.target = target;
  return this;
};

function value_of(target){
  return new Subject(target);
};

Subject.prototype.should_be = function (expected, message){
  equals(this.target, expected, message);
};

Subject.prototype.should_include = function (expected, message){
  ok(expected in this.target, message);
};

Subject.prototype.should_match = function (re, message){
  ok(Boolean(this.target.match(re)), message);
};


Subject.prototype.should_match = function (re, message){
  ok(Boolean(this.target.match(re)), message);
};

Subject.prototype.should_not_match = function (re, message){
  ok(!Boolean(this.target.match(re)), message);
};

Subject.prototype.should_recursivly_be = function (expected, message){
  same(this.target, expected, message);
};




