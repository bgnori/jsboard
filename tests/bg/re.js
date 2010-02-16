example('正規表現 基本', function() {
  value_of(jsboard).should_include('pattern');
  value_of(jsboard.pattern.Line).should_be('(?:\\r\\n|\\n|\\r)');
  value_of(jsboard.movelist).should_include('re');
  value_of(jsboard.mat).should_include('re');
});


