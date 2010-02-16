test('正規表現 gnubg関係', function() {
  value_of(jsboard.gnubg).should_include('re');
  value_of('Position ID: 4PPgAQPgc+QBIg').should_match(jsboard.gnubg.re.postionID);
  value_of('Match ID: cAl7AAAAAAAA').should_match(jsboard.gnubg.re.matchID);
  value_of('4PPgAQPgc+QBIg:cAl7AAAAAAAA').should_match(jsboard.gnubg.re.gnubgID);
  value_of(jsboard.gnubg.find('4PPgAQPgc+QBIg:cAl7AAAAAAAA'))
      .should_be('4PPgAQPgc+QBIg:cAl7AAAAAAAA');
  value_of(jsboard.gnubg.find("Position ID: 4PPgAQPgc+QBIg\nMatch ID: cAl7AAAAAAAA"))
      .should_be('4PPgAQPgc+QBIg:cAl7AAAAAAAA');
});

