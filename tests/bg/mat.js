example('正規表現 mat関係', function() {
    value_of(Boolean(jsboard.mat.re)).should_be(true);
    value_of(Boolean(jsboard.mat.re.file)).should_be(true);
    value_of(Boolean(jsboard.mat.re.match)).should_be(true);
    value_of(Boolean(jsboard.mat.re.game)).should_be(true);
    value_of(Boolean(jsboard.mat.re.action)).should_be(true);
  }
);
example('正規表現 mat file 関係', function() {
    value_of(Boolean(jsboard.mat.re.file)).should_be(true);
    value_of('; [Site "eXtreme Gammon"]'
    ).should_match(jsboard.mat.re.file.headername);

    value_of('; [Site "eXtreme Gammon"]'
    ).should_match(jsboard.mat.re.file.headervalue);

    value_of('; [Site "eXtreme Gammon"]'
    ).should_match(jsboard.mat.re.file.header);
  }
);

example('正規表現 mat match関係', function() {
    value_of(Boolean(jsboard.mat.re.match)).should_be(true);
    value_of('5 point match'
    ).should_match(jsboard.mat.re.match);
    value_of('7 point match'
    ).should_match(jsboard.mat.re.match);
  }
);

example('正規表現 mat game 関係', function(){
    value_of(Boolean(jsboard.mat.re.game)).should_be(true);
    value_of(' Game 1'
    ).should_match(jsboard.mat.re.game.nth);
    value_of(' Game 123'
    ).should_match(jsboard.mat.re.game.nth);

    value_of(' Game a'
    ).should_not_match(jsboard.mat.re.game.nth);

    value_of(' Jake Jacobs : 0                 Hosaka Noriyuki : 0'
    ).should_match(jsboard.mat.re.game.player);

    value_of(' Jake Jacobs : 1000                 Hosaka Noriyuki : 0'
    ).should_match(jsboard.mat.re.game.player);

    value_of(' Game 1\n'
           + ' Jake Jacobs : 0                 Hosaka Noriyuki : 0'
    ).should_match(jsboard.mat.re.game.header);

    value_of(' Game 1'
           + ' Jake Jacobs : 0                 Hosaka Noriyuki : 0'
    ).should_match(jsboard.mat.re.game.header);

    value_of(' Game 1\r\n'
           + ' Jake Jacobs : 0                 Hosaka Noriyuki : 0\r\n'
           + '  1) 41: 24/23 13/9              43: 13/9 24/21              \r\n'
           + '  2) 21: 6/4 23/22               22: 25/23 23/21 6/4 6/4     \r\n'
           + '  3) 32: 25/22 6/4               54: 25/21 21/16             \r\n'
    ).should_match(jsboard.mat.re.game.game);

    value_of(' Game 1'
           + ' Jake Jacobs : 0                 Hosaka Noriyuki : 0'
           + '  1) 41: 24/23 13/9              43: 13/9 24/21              '
           + '  2) 21: 6/4 23/22               22: 25/23 23/21 6/4 6/4     '
           + '  3) 32: 25/22 6/4               54: 25/21 21/16             '
    ).should_match(jsboard.mat.re.game.game);

    value_of(' Game 3\r\n'
           + ' Jake Jacobs : 2                 Hosaka Noriyuki : 2\r\n'
           + '  1)                             63: 24/18 13/10             \r\n'
           + '  2) 31: 8/5 6/5                 55: 18/13 13/8 8/3 8/3      \r\n'
           + '  3) 64: 24/18 18/14             52: 6/1 13/11               \r\n'
    ).should_match(jsboard.mat.re.game.game);
    value_of(' Game 3'
           + ' Jake Jacobs : 2                 Hosaka Noriyuki : 2'
           + '  1)                             63: 24/18 13/10             '
           + '  2) 31: 8/5 6/5                 55: 18/13 13/8 8/3 8/3      '
           + '  3) 64: 24/18 18/14             52: 6/1 13/11               '
    ).should_match(jsboard.mat.re.game.game);
    value_of(' Game 3\r\n'
           + ' Jake Jacobs : 2                 Hosaka Noriyuki : 2\r\n'
           + '  1)                             63: 24/18 13/10             \r\n'
           + '  2) 31: 8/5 6/5                 55: 18/13 13/8 8/3 8/3      \r\n'
           + '  3) 64: 24/18 18/14             52: 6/1 13/11               \r\n'
           + '  4) 65: 25/20                    Doubles => 2               \r\n'
           + '  5)  Takes                      65: 11/5 10/5               \r\n'
    ).should_match(jsboard.mat.re.game.game);
    value_of(' Game 3'
           + ' Jake Jacobs : 2                 Hosaka Noriyuki : 2'
           + '  1)                             63: 24/18 13/10             '
           + '  2) 31: 8/5 6/5                 55: 18/13 13/8 8/3 8/3      '
           + '  3) 64: 24/18 18/14             52: 6/1 13/11               '
           + '  4) 65: 25/20                    Doubles => 2               '
           + '  5)  Takes                      65: 11/5 10/5               '
    ).should_match(jsboard.mat.re.game.game);
  }
);

example('正規表現 mat action 関係', function() {
    value_of(Boolean(jsboard.mat.re.action)).should_be(true);
    value_of('31: 8/6 6/5').should_match(jsboard.mat.re.action.move);
    value_of(' Doubles => 2              ').should_match(jsboard.mat.re.action.cube);
    value_of('Doubles => 2').should_not_match(jsboard.mat.re.action.cube);
    value_of(' Takes                     ').should_match(jsboard.mat.re.action.cube);
    value_of('Takes ').should_not_match(jsboard.mat.re.action.cube);
    value_of(' Drops                     ').should_match(jsboard.mat.re.action.cube);
    value_of('Drops').should_not_match(jsboard.mat.re.action.cube);
    value_of(' Doubles => 16             ').should_match(jsboard.mat.re.action.cube);
    value_of('Doubles => 16').should_not_match(jsboard.mat.re.action.cube);
    value_of(' Doubles => 16             ').should_match(jsboard.mat.re.action.action);
    value_of('Doubles => 16').should_not_match(jsboard.mat.re.action.action);
    value_of(' Drops                     ').should_match(jsboard.mat.re.action.action);
    value_of('Drops').should_not_match(jsboard.mat.re.action.action);
    value_of('31: 8/6 6/5').should_match(jsboard.mat.re.action.action);
         value_of(' Takes                     ').should_match(jsboard.mat.re.action.cube);
    value_of('  5)  Takes                      65: 11/5 10/5               ')
      .should_match(jsboard.mat.re.action.line);
    debug('hoge');
    debug('  5)  Takes                      65: 11/5 10/5               '.match(jsboard.mat.re.action.line));
    value_of('  1)                             63: 24/18 13/10             ')
      .should_match(jsboard.mat.re.action.line);
  }
);

example('mat ファイル parser', function(){
  value_of(jsboard.mat).should_include('parser');
  value_of(jsboard.mat.parser).should_include('moves');
  value_of(jsboard.mat.parser).should_include('headers');
  value_of(jsboard.mat.parser).should_include('file');
});

example('mat ファイル parser.moves', function(){
  var xs =  ('  1)                             63: 24/18 13/10             \r\n'
           + '  2) 31: 8/5 6/5                 55: 18/13 13/8 8/3 8/3      \r\n'
           + '  3) 64: 24/18 18/14             52: 6/1 13/11               \r\n'
           + '  4) 65: 25/20                    Doubles => 2               \r\n'
           + '  5)  Takes                      65: 11/5 10/5               \r\n');
  var expected = {
    0: {
      nth: 1,
      0: undefined,
      1: {
        cube: 0,
        dice:'63',
        move:'24/18 13/10 ',
      }
    },
    1: {
      nth: 2,
      0: {
        cube: 0,
        dice: '31',
        move: '8/5 6/5 ',
      },
      1: {
        cube: 0,
        dice: '55',
        move: '18/13 13/8 8/3 8/3 '
      }
    },
    2: {
      nth: 3,
      0: {
        cube: 0,
        dice: '64',
        move: '24/18 18/14 '
      },
      1: {
        cube: 0,
        dice: '52',
        move: '6/1 13/11 ',
      }
    },
    3: {
      nth: 4,
      0: {
        cube: 0,
        dice: '65',
        move: '25/20 ',
      },
      1: {
        cube: ' Doubles => 2               ',
      },
    },
    4: {
      nth: 5,
      0: {
        cube: ' Takes                      ',
      },
      1: {
        cube: 0,
        dice: '65',
        move: '11/5 10/5 '
      }
    }
  };
  value_of(jsboard.mat.parser.moves(xs)[0]).should_recursivly_be(expected[0]);
  value_of(jsboard.mat.parser.moves(xs)[1]).should_recursivly_be(expected[1]);
  value_of(jsboard.mat.parser.moves(xs)[2]).should_recursivly_be(expected[2]);
  value_of(jsboard.mat.parser.moves(xs)[3]).should_recursivly_be(expected[3]);
  value_of(jsboard.mat.parser.moves(xs)[4]).should_recursivly_be(expected[4]);
});


example('mat ファイル parser.headers', function(){
  var xs =  ('; [Site "eXtreme Gammon"]\r\n'
          +  '; [Match ID "238991235"]\r\n'
          +  '; [Player 1 "Jake Jacobs"]\r\n'
          +  '; [Player 2 "Hosaka Noriyuki"]\r\n'
          +  '; [Player 1 Elo "1600.00/0"]\r\n'
          +  '; [Player 2 Elo "1600.00/0"]\r\n'
          +  '; [EventDate "2009.10.03"]\r\n'
          +  '; [EventTime "21.53"]\r\n'
          +  '; [Variation "Backgammon"]\r\n'
          +  '; [Unrated "Off"]\r\n'
          +  '; [Crawford "On"]\r\n'
          +  '; [CubeLimit "1024"]\r\n');
  var expected = {
    'Site': 'eXtreme Gammon',
    'Match ID':  '238991235',
    'Player 1': 'Jake Jacobs',
    'Player 2': 'Hosaka Noriyuki',
    'Player 1 Elo': '1600.00/0',
    'Player 2 Elo': '1600.00/0',
    'EventDate': '2009.10.03',
    'EventTime': '21.53',
    'Variation': 'Backgammon',
    'Unrated': 'Off',
    'Crawford': 'On',
    'CubeLimit': '1024'
  };
  var actual;
  actual = jsboard.mat.parser.headers(xs);
  //debug(actual);
  //debug(expected);
  value_of(actual).should_recursivly_be(expected);
           
});

example('mat ファイル parser.file', function(){
  //Ugh! add test.  
});

