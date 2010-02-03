/* 
  This script requires jQuery 1.4.0
  Copyright 2009 Noriyuki Hosaka bgnori@gmail.com
*/


(function($){
  function debug(){
    if (window['console']){
      console.log.apply(null, arguments);
    };
  };

  var def = {
      style: "nature",
      delay: 50,
      css: "http://assets.backgammonbase.com/default.css",
      move_api_url : "http://move.api.backgammonbase.com/",
      debug: true,
  };
  jsboard.config = jsboard.config || def;
  $.extend(def, jsboard);
  jsboard = def;
  
  jsboard['imageURL'] = function (gnubgid, height, width, css){
    return 'http://image.backgammonbase.com/image?' + 
      'gnubgid=' +  encodeURIComponent(gnubgid) + 
      '&height='+height +
      '&width='+width + 
      '&css='+ css +
      '&format=png';
  };

  function image(p, gnubgid, css, usemap){
    var img;
    img = p.find('[class="jsboard-image"]');
    if (img.length == 0){
      // There is nothing.
      p.append($('<img class="jsboard-image" />'));
      img = p.find('[class="jsboard-image"]');
      //debug('made image elem');
    }else{
      // There is already something 
      if(img.length != 1){
        alert('ugh!!!');
      }
    }
    // not sure that image has loaded so, use css
    var w = parseInt(img.css('width')); //asume px
    var h = parseInt(img.css('height')); //assume px
    //debug(w);
    //debug(h);
    img.attr("usemap", usemap);
    img.attr("alt", gnubgid);
    img.attr("src", jsboard.imageURL(gnubgid, h, w, css));
  };

  function area(map, id, shape, coords, alt){
    map.append($('<a id="'+ id 
               + '" shape="' + shape 
               + '" coords="' + coords 
               + '" alt="' + alt 
               + '" nohref="nohref" />'));
  };
  

  jsboard['re'] = {};
  jsboard['re']['gnubg'] = {
    postionID: new RegExp("Position ID: ([A-Za-z0-9/+]{14})"),
    matchID: new RegExp("Match ID: ([A-Za-z0-9/+]{12})"),
    gnubgID: new RegExp("[A-Za-z0-9/+]{14}:[A-Za-z0-9/+]{12}")
  };
  jsboard['re']['gnubg']['find'] = function(t){
    var pos;
    var match;
    var e;
    if (t) {
      try{
        pos = t.match(jsboard.re.gnubg.postionID)[1];
        match = t.match(jsboard.re.gnubg.matchID)[1];
        if ( pos && match ){
          return pos + ':' + match;
        };
      }catch(e){
        //surpress error try other.
      };
      try{
        var gnubgid = t.match(jsboard.re.gnubg.gnubgID);
        if (gnubgid){
          return gnubgid;
        };
      }catch(e){
        //surpress error and use default value
      };
    };
    return '4HPwATDgc/ABMA:cAkAAAAAAAAA';
    //return '4PPgAQPgc+QBIg:cAl7AAAAAAAA';
  };
  
  var CR = "\\n";
  var LF = "\\r";
  var CRLF = "\\r\\n";
  var Line = '(?:' + CRLF + '|' + CR + '|' + LF + ')';
  var floatPattern = "(?:[+-]?\\d+\\.\\d+)";
  var floatRegExp = new RegExp(floatPattern, 'g');
  var movePlacePattern = "(?:\\d+\\. )";
  var movePlaceRegExp = new RegExp(movePlacePattern, 'g');
  var evalTypePattern = "(?:(?:Cubeful [01234]-ply)|(?:Rollout))";
  var evalTypeRegExp = new RegExp(evalTypePattern, 'g');
  var pointPattern = "(?:(?:bar)|(?:[12]\\d|\\d)|(?:off))";
  var pointRegExp = new RegExp(pointPattern, 'g');
  var movePattern = "(?:(?:" + pointPattern + "/(?:" + pointPattern + "\\*?)+(?:\\([1-4]\\))?) ?)+";
  var moveRegexp = new RegExp(movePattern, 'g');
  var equityPattern = "Eq.: +"+floatPattern + "(?: \\( "+ floatPattern + "\\))?";
  var equityRegexp = new RegExp(equityPattern, 'g');
  
  var MoveHeaderPattern = "(?:(?: ){4}" + movePlacePattern + "(?: )*" + evalTypePattern + "(?: )*" + movePattern + "(?: )*" + equityPattern + ')';
  var MoveHeaderRegExp = new RegExp(MoveHeaderPattern,'g');
  var allEquityPattern =  '(?:'+ floatPattern + ' ' + floatPattern + ' ' + floatPattern + ' - ' 
                               + floatPattern + ' ' + floatPattern + ' ' + floatPattern + ')';
  debug(allEquityPattern);
  var CFCLPattern =  '(?: CL  [ +-]' + floatPattern + ' CF  [ +-]' + floatPattern + ')';
  debug(CFCLPattern);

  var MoveDataPattern = '(?:(?: ){4}(?:' 
   +  '(?:(?: ){3}'
   +    allEquityPattern + CFCLPattern + '?'
   +  ')|'
   +  '(?:(?: ){2}'
   +    '\\[' + allEquityPattern + CFCLPattern + '\\]'
   +  ')|'
   +  '(?:(?: ){4}('
   +      '(?:(?: ){0,3}(?:\\S))+'
   +  '))'
   +'))';
  debug(MoveDataPattern);
  var MoveDataRegExp = new RegExp(MoveDataPattern, 'g');
  var MoveListingPattern = MoveHeaderPattern + Line + '?' + '(?:' + MoveDataPattern + Line +'?'+ ')*';
  debug(MoveListingPattern);
  var MoveListingRegExp = new RegExp(MoveListingPattern, 'g');

  var MoveHeaderOrDataPattern = MoveHeaderPattern + '|' + MoveDataPattern ;
  var MoveHeaderOrDataRegExp = new RegExp(MoveHeaderOrDataPattern, 'g');

  function moveFinder(t){
    var m = t.match(MoveListingRegExp);
    debug(m);
    return m;
  };

  function reformatMove(mv){
    return mv.match(MoveHeaderOrDataRegExp).join('\n');
  };

  function moveList(r, mv, odd){
    debug(mv);
    var m = mv.match(moveRegexp);
    debug(m);
    if (odd){
      r.append($('<div class="movelist-odd-row" alt="' + m
                  + '"><pre>' + reformatMove(mv) + '</pre></div>'));
    }else{
      r.append($('<div class="movelist-even-row" alt="' + m
                  + '"><pre>' + reformatMove(mv) + '</pre></div>'));
    };
  
    var img = r.find("img");
    var href = img.attr('href');
    var alt = img.attr('alt');
  
    $.ajax({
      url: jsboard.config.move_api_url,
      dataType : "jsonp",
      cache : false,
      data : {'move' : m[0], gnubgid : alt},
      success : function (data, dataType){
        // already image has loaded so, use attr
        var w = img.attr('width');
        var h = img.attr('height');
        //debug(w);
        //debug(h);
  
        var a = r.find('[alt="' + m + '"]');
        a.hover(
          function over(){
            if (odd){
              a.attr('class', 'movelist-odd-row-hover');
            }else{
              a.attr('class', 'movelist-even-row-hover');
            }
            img.attr('src', jsboard.imageURL(data.gnubgid, h, w, jsboard.style));
          },
          function out(){
            if (odd){
              a.attr('class', 'movelist-odd-row');
            }else{
              a.attr('class', 'movelist-even-row');
            }
            img.attr('src', jsboard.imageURL(alt, h, w, jsboard.style));
          });
        },
      error : function(){
        alert("error");
      }
    });
  };
  
  var matHeaderNamePattern = 
        '(?:' 
      +   'Site|'
      +   'Match ID|'
      +   'Player 1|'
      +   'Player 2|'
      +   'Player 1 Elo|'
      +   'Player 2 Elo|'
      +   'EventDate|'
      +   'EventTime|'
      +   'Variation|'
      +   'Unrated|'
      +   'Crawford|'
      +   'CubeLimit'
      + ')'
  var matHeaderNameRegExp = new RegExp(matHeaderNamePattern);
  var matHeaderValuePattern = '"[^"]+"';
  var matHeaderValueRegExp = new RegExp(matHeaderValuePattern);
  var matHeaderPattern = 
        '(?:; \\['
      + matHeaderNamePattern
      + ' ' // There is a white space!!
      + matHeaderValuePattern
      + '\\])';
/*
; [Site "eXtreme Gammon"]
; [Match ID "238991235"]
; [Player 1 "Jake Jacobs"]
; [Player 2 "Hosaka Noriyuki"]
; [Player 1 Elo "1600.00/0"]
; [Player 2 Elo "1600.00/0"]
; [EventDate "2009.10.03"]
; [EventTime "21.53"]
; [Variation "Backgammon"]
; [Unrated "Off"]
; [Crawford "On"]
; [CubeLimit "1024"]
*/

  var matHeaderRegExp = new RegExp(matHeaderPattern, 'g');
  
  var matMatchHeaderPattern = '(?:\\d+ point match)' //ugh! money game
  var matMatchHeaderRegExp = new RegExp(matMatchHeaderPattern);
  var matGameNthPattern = '(?: Game \\d+)';
  var matGameNthRegExp = new RegExp(matGameNthPattern, 'g');
  var matPlayerNameWithScorePattern ='(?:[ a-zA-Z]+: \\d+)';
  var matPlayerNameWithScoreRegExp = new RegExp(matPlayerNameWithScorePattern, 'g');
  var matGameHeaderPattern = '(?:' 
                            + matGameNthPattern
                            + Line + '? '
                            + matPlayerNameWithScorePattern
                            + matPlayerNameWithScorePattern
                            + Line + '?' + ')';
  var matGameHeaderRegExp = new RegExp(matGameHeaderPattern, 'g');

  var matMovePattern = '(?:[1-6][1-6]:(?: ' + movePattern + ')* *)';
  var matMoveRegExp = new RegExp(matMovePattern);
  var matCubePattern = '(?: (Takes *)|(Doubles => \\d+ *)|(Drops *))'
  var matCubeRegExp = new RegExp(matCubePattern);
  var matResignPattern = '(?:( [?]{3} *))';
  var matActionPattern = '(?:'+ matMovePattern + '|' + matCubePattern + ')';
  var matActionRegExp = new RegExp(matActionPattern, 'g');
  var matLinePattern = '(?:[1-9 ][0-9 ][0-9]\\) ' + matActionPattern + matActionPattern + ')';
  //  1) 41: 24/23 13/9              43: 13/9 24/21              
  //  8) 53: 24/21 13/8               Doubles => 2               
  //  9)  Takes                      62: 13/7 13/11              
  var matLineRegExp = new RegExp(matLinePattern, 'g');
  var matGamePattern = '(?:' + matGameHeaderPattern + Line + '?'
                     +       '(?:' + matLinePattern + Line + '?)+'
                     + ')';

  var matGameRegExp = new RegExp(matGamePattern, 'g');

  function matAction(t){
    if (t != ''){
      var move = '';
      var cube = '';
      var resign = '';
      move = (t.match(matMoveRegExp)||{0:''})[0];
      if (move != ''){
        debug(move);
        return {
          'cube': 0,
          dice: move.slice(0, 2), 
          'move': (move.match(moveRegexp)|| {0:''})[0],
        };
      };
      cube = (t.match(matCubeRegExp)||{0:''})[0];
      if (cube != ''){
        return {
          'cube': cube,
        };
      };
    }else{
      return {};
    };
  };

  function matMoves(t){
    var r = {};
    var lines = t.match(matLineRegExp);
    for (n in lines){
      var current_move = {};
      var k = lines[n];
      var nth = parseInt(k.slice(0,3));
      var pair = k.match(matActionRegExp)
      current_move[0] = matAction(pair[0]);
      current_move[1] = matAction(pair[1]);
      current_move.nth = nth;
      r[n] = current_move;
    };
    return r;
  };

  function matHeader(xs){
    var r = {};
    debug('matHeader', xs);
    var i;
    for (i in xs){
      var n = xs[i].match(matHeaderNameRegExp)[0];
      var v = xs[i].match(matHeaderValueRegExp)[0];
      v = v.slice(1, -1);
      debug(n, v);
      r[n] = v;
    };
    return r;
  };

  function matFile(t){
    var matchnavi = {};
    var xs;
    var i;
    matchnavi.headers = matHeader(t.match(matHeaderRegExp));
    matchnavi.match_length = parseInt(t.match(matMatchHeaderRegExp)[0]);
    matchnavi.games = {};
    xs = t.match(matGameRegExp);
    for (i in xs){
      var h = (xs[i].match(matGameHeaderRegExp))[0];
      var p = h.match(matPlayerNameWithScoreRegExp);
      var score = {};
      score[0]=  parseInt(p[0].match('\\d+$'));
      score[1]=  parseInt(p[1].match('\\d+$'));
      n = h.match(matGameNthRegExp)[0];
      matchnavi.games[i] = {
        name: n,
        match_length: matchnavi.match_length,
        nth: parseInt(n.slice(6)),
        moves: matMoves(xs[i]),
        score: score
      };
      debug(matchnavi.games[i]);
    };
    return matchnavi;
  };


  function matGameCursor(){
    return {
      nth: null,
      on_action: null,
      cube_action: null,
      gnubgid: null,
      current_move: null,
      game: null,
      on_success: null,
      bind: function(game, on_success, after){
        var self = this; //ugh!
        debug('matGameCursor:bind', self);
        self.on_success = on_success;
        self.game = game;
        if (self.game.moves[0][0].dice){
          self.nth = 0;
          self.on_action = 0;
          self.cube_action = true;
        }else{
          self.nth = 0;
          self.on_action = 1;
          self.cube_action = true;
        };
        $.ajax({
          url: jsboard.config.move_api_url,
          dataType : "jsonp",
          cache : false,
          'data' : {
            'new': (String(self.nth) + ':' 
                    + String(self.game.score[0]) 
                    + '-' 
                    + String(self.game.score[1]) 
                    + '/'
                    + String(self.game.match_length))
          }, 
          success : function(data, dataType){
            self.gnubgid = data.gnubgid; //ugh!
            after();
          }
        });
        return self;
      },
      read: function(){
        var self = this; //ugh!
        debug('matGameCursor:read', self);
        var current_move = self.game.moves[self.nth][self.on_action];
        debug(current_move, self.nth, self.on_action);
        if (self.cube_action){
          data = {
            'cube' : 'no double',
            'dice' : current_move.dice, 
            'gnubgid' : self.gnubgid,
            'pickupdice' : false
          };
        }else{
          data = {
            'move' : current_move.move, 
            'gnubgid' : self.gnubgid,
            'pickupdice' : true
          };
        };
        return data;
      },
      isDone: function(){
        var self = this; // ugh!
        if (typeof(self.game.moves[self.nth]) == 'undefined'){
          debug('matGameCursor:isDone true', self);
          return true;
        };
        debug('matGameCursor:isDone false', self);
        return false;
      },
      next: function(){
        var self = this; // ugh!
        debug('matGameCursor:next', self);

        $.ajax({
          url: jsboard.config.move_api_url,
          dataType : "jsonp",
          cache : false,
          'data' : self.read(),
          success : function (data, dataType){
            self.gnubgid = data.gnubgid;
            self.on_success();
            if (self.on_action){
              if(self.cube_action){
                // cube done.
                self.cube_action = false;
              }else{
                // moved
                self.cube_action = true;
                self.on_action = 0;
                self.nth += 1;
              };
            }else{
              if(self.cube_action){
                // cube done.
                self.cube_action = false;
              }else{
                // moved
                self.cube_action = true;
                self.on_action = 1;
              };
            };
          },
        });
      }
    };
  };

  function matMatchCursor(){
    return {
      matchnavi: null,
      current: null,
      nth: null,
      on_success: null,
      gnubgid: '',
      subbind: function(after){
        var self = this;
        debug('matMatchCursor:subbind', self);
        self.current = matGameCursor();
        self.current.bind(self.matchnavi.games[self.nth], function(){
          self.gnubgid = self.current.gnubgid;
          self.on_success();
        }, after);
        return self;
      },
      bind: function(matchnavi, on_success, after){
        var self = this;
        debug('matMatchCursor:bind', self);
        self.matchnavi = matchnavi;
        self.on_success = on_success;
        self.nth = 0;
        self.subbind(after);
        return self;
      },
      isDone: function(){
        debug('matMatchCursor:isDone', self);
        return false;
      },
      next: function(){
        var self = this;
        debug('matMatchCursor:next', self);
        if (self.current.isDone()){
          self.nth += 1;
          if (self.matchnavi.games[self.nth] == undefined){
            debug('end of match');
          }else{
            self.subbind(function(){
              //after
            });
          };
        };
        self.current.next(function(){
          self.gnubgid = self.current.gnubgid;
          self.on_success();
        });
        return self;
      }
    };
  };

  function make_matviewer(n){
    var img;
    var h;
    var w;
    var root = $(this);
    var text = root.text();
    var cursor = matMatchCursor();
    
    image(root, '', jsboard.style, '#matviewer');
    img = root.find("img");
    w = img.attr('width');
    h = img.attr('height');

    cursor.bind(matFile(text), function(){
      img.attr('src', jsboard.imageURL(cursor.gnubgid, h, w, jsboard.style));
    }, function(){
      cursor.next(); // forcing very first to be loaded
      img.click(function(){
        cursor.next();
      });
    });
  };

  function viewer(n){
    var id_str =  'jsboard'+n;

    var root = $(this);

    var text = root.text();
    var gnubgid = jsboard.re.gnubg.find(text);
    var mvlist = moveFinder(text);

    root.empty(); //clean

    image(root, gnubgid, jsboard.style, '#'+id_str);

    root.append($('<map name="' + id_str + '" id="'+ id_str + '" />'));

    var mv;
    for (n in  mvlist){
      mv = mvlist[n];
      moveList(root, mv, n%2);
    };
  };

  function player(n){
    var map = $('#' + id_str);
    area(map, "13pt", "rect", "25,5,43,93", "13pt");
    area(map, "7pt", "rect", "115,139,133,227", "7pt");
    area(map, "yourbar", "rect", "133,116,158,228", "yourbar");
  };

  function editor(n){
  };


  function loadCSS(src, delay, onload, error){
    $.ajax({
      type: "GET",
      url: src,
      dataType: 'text',
      success: function(data, dataType){
        debug('inserting ' + src);
        var link = $('<link rel="stylesheet" type="text/css" href="'+ src+ '" />');
        $("head").append(link);
        setTimeout(function(){
          onload();
        }, 
        delay);
      },
      'error': error,
    });
  };

  // entry point
  $(document).ready(function(){
    loadCSS(jsboard.css, jsboard.delay, 
    function(){
      debug('processing.');
      $('.jsboard').each(viewer);
      $('.jsmatviewer').each(make_matviewer);
    }, 
    function (XMLHttpRequest, testStatus, errorThrown){
      debug('css load failed: '+ jsboard.css);
    }); 
  });
})(jQuery);


