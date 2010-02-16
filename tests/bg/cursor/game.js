

example('game cursor', function(){
  jsboard.config.move_api_url = "http://localhost:8000/";
  var g = {
  match_length: 5,
  score: {
    0: 2,
    1: 2
  },
  moves: {
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
  }};
  var c = jsboard.gameCursor();
  var count = 0;
  stop(3000);
  debug('---');
  c.bind(g, function(){}) //bind returns Deferred object.
  .next(function(){
    value_of(c.isDone()).should_be(false);
    debug('next after bind');
    return loop({
        begin: 0,
        end: 17,
        step: 1
      }, 
      function(){
        debug('loop iter', count);
        count+=1;
        value_of(c.isDone()).should_be(false);
        return c.next();
    })
    .next(function(){
      debug('loop done');
      value_of(c.isDone()).should_be(true);
    });
  })
  .next(function(){
    start();
    debug('resuming test');
  });
});
