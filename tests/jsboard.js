
test('hello jsboard', function(){
  ok(true);
});

example('jsboardがglobalで定義されている。', function() {
  value_of(Boolean(jsboard)).should_be(true);
});


