/* 
  This script requires jQuery 1.4.0
  Copyright 2009 Noriyuki Hosaka bgnori@gmail.com
*/


(function ($, jsboard){
  function debug(){
    if (window['console']){
      console.log.apply(null, arguments);
    };
  };

  jsboard = jsboard || {};
  var default_conf = {
      style: "nature",
      delay: 50,
      css: "http://assets.backgammonbase.com/default.css",
      move_api_url : "http://move.api.backgammonbase.com/",
  };
  $.extend(default_conf, jsboard.config || default_conf);
  jsboard.config = default_conf;
  debug(jsboard);
  

  jsboard.fn = {};
  jsboard.fn.imageURL = function (gnubgid, height, width, css){
    return 'http://image.backgammonbase.com/image?' + 
      'gnubgid=' +  encodeURIComponent(gnubgid) + 
      '&height='+height +
      '&width='+width + 
      '&css='+ css +
      '&format=png';
  };
  debug(jsboard.fn.imageURL('gnubgid', 300, 400, 'nature'));

  jsboard.fn.image = function(p, gnubgid, css, usemap){
    var img;
    debug('jsboard.fn.image', p, gnubgid, css);
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
    img.attr("src", jsboard.fn.imageURL(gnubgid, h, w, css));
  };

  jsboard.fn.area = function (map, id, shape, coords, alt){
    map.append($('<a id="'+ id 
               + '" shape="' + shape 
               + '" coords="' + coords 
               + '" alt="' + alt 
               + '" nohref="nohref" />'));
  };
  

  jsboard.pattern = {
    CR: "\\n",
    LF: "\\r",
    CRLF: "\\r\\n",
    BASE64: '[A-Za-z0-9/+]',
    'float': "(?:[+-]?\\d+\\.\\d+)"
  };
  jsboard.pattern.Line = '(?:' + jsboard.pattern.CRLF + '|' + jsboard.pattern.CR + '|' + jsboard.pattern.LF + ')';

  //floatRegExp = new RegExp(jsboard.pattern.float, 'g');

  /*
   *
   *    jsboard.gnubg
   *
   */
  jsboard.gnubg = {};
  jsboard.gnubg.re = {
    postionID: new RegExp("Position ID: (" + jsboard.pattern.BASE64 + "{14})"),
    matchID: new RegExp("Match ID: (" + jsboard.pattern.BASE64 + "{12})"),
    gnubgID: new RegExp(jsboard.pattern.BASE64 + "{14}:" + jsboard.pattern.BASE64 +"{12}")
  };

  jsboard.gnubg.find = function(t){
    var pos;
    var match;
    var e;
    if (t) {
      try{
        pos = t.match(jsboard.gnubg.re.postionID)[1];
        match = t.match(jsboard.gnubg.re.matchID)[1];
        if ( pos && match ){
          return pos + ':' + match;
        };
      }catch(e){
        //surpress error try other.
      };
      try{
        var gnubgid = t.match(jsboard.gnubg.re.gnubgID);
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
  
  /*
   *
   *    jsboard.movelist
   *
   */
  (function(){
    jsboard.movelist = {};
    var movePlacePattern = "(?:\\d+\\. )";
    var evalTypePattern = "(?:(?:Cubeful [01234]-ply)|(?:Rollout))";
    var pointPattern = "(?:(?:bar)|(?:[12]\\d|\\d)|(?:off))";
    var movePattern = "(?:(?:" + pointPattern + "/(?:" + pointPattern + "\\*?)+(?:\\([1-4]\\))?) ?)+";
    var equityPattern = "Eq.: +"+jsboard.pattern.float + "(?: \\( "+ jsboard.pattern.float + "\\))?";
    var MoveHeaderPattern = "(?:(?: ){4}" + movePlacePattern + "(?: )*" + evalTypePattern + "(?: )*" + movePattern + "(?: )*" + equityPattern + ')';
    var allEquityPattern =  '(?:'+ jsboard.pattern.float + ' ' + jsboard.pattern.float + ' ' + jsboard.pattern.float + ' - ' 
                                 + jsboard.pattern.float + ' ' + jsboard.pattern.float + ' ' + jsboard.pattern.float + ')';
    var CFCLPattern =  '(?: CL  [ +-]' + jsboard.pattern.float + ' CF  [ +-]' + jsboard.pattern.float + ')';
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
    var MoveListingPattern = MoveHeaderPattern + jsboard.pattern.Line + '?' + '(?:' + MoveDataPattern + jsboard.pattern.Line +'?'+ ')*';
    var MoveHeaderOrDataPattern = MoveHeaderPattern + '|' + MoveDataPattern ;

    jsboard.movelist.patterns = {
      //putting patterns in name space gives so little.
      'move': movePattern, //Ugh!
    };

    jsboard.movelist.re = {
      //var movePlaceRegExp = new RegExp(movePlacePattern, 'g');
      //var equityRegexp = new RegExp(equityPattern, 'g');
      //var evalTypeRegExp = new RegExp(evalTypePattern, 'g');
      //var pointRegExp = new RegExp(pointPattern, 'g');
      //var MoveHeaderRegExp = new RegExp(MoveHeaderPattern,'g');
      //var MoveDataRegExp = new RegExp(MoveDataPattern, 'g');
      move: new RegExp(movePattern, 'g'),
      list: new RegExp(MoveListingPattern, 'g'),
      data: new RegExp(MoveHeaderOrDataPattern, 'g'),
    };
  })();


  /*
   *
   *    jsboard.mat
   *
   */
  (function(){
    jsboard.mat = {};
    jsboard.mat.patterns = {
      //putting patterns in name space gives so little.
    };
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
    var matHeaderValuePattern = '"[^"]+"';
    var matHeaderPattern = 
          '(?:; \\['
        + matHeaderNamePattern
        + ' ' // There is a white space!!
        + matHeaderValuePattern
        + '\\])';

    var matMatchHeaderPattern = '(?:\\d+ point match)' //ugh! money game
    var matGameNthPattern = '(?: Game \\d+)';
    var matPlayerNameWithScorePattern ='(?:[ a-zA-Z]+: \\d+)';
    var matGameHeaderPattern = '(?:' 
                              + matGameNthPattern
                              + jsboard.pattern.Line + '? '
                              + matPlayerNameWithScorePattern
                              + matPlayerNameWithScorePattern
                              + jsboard.pattern.Line + '?' + ')';
    var matMovePattern = '(?:[1-6][1-6]:(?: ' + jsboard.movelist.patterns.move+ ')* *)';
    var matCubePattern = '(?: (Takes *)|(Doubles => \\d+ *)|(Drops *))'
    var matResignPattern = '(?:( [?]{3} *))';
    var matActionPattern = '(?:'+ matMovePattern + '|' + matCubePattern + '|(?: )+)';
    var matLinePattern = '(?:[1-9 ][0-9 ][0-9]\\) ' + matActionPattern + matActionPattern + ')';
    //  1) 41: 24/23 13/9              43: 13/9 24/21              
    //  8) 53: 24/21 13/8               Doubles => 2               
    //  9)  Takes                      62: 13/7 13/11              
    var matGamePattern = '(?:' + matGameHeaderPattern + jsboard.pattern.Line + '?'
                       +       '(?:' + matLinePattern + jsboard.pattern.Line + '?)+'
                       + ')';

    jsboard.mat.re = {
      file: {
        headername:  new RegExp(matHeaderNamePattern),
        headervalue:new RegExp(matHeaderValuePattern),
        header: new RegExp(matHeaderPattern, 'g')
      },
      match: {
        header: new RegExp(matMatchHeaderPattern),
      },
      game: {
        nth: new RegExp(matGameNthPattern, 'g'),
        player: new RegExp(matPlayerNameWithScorePattern, 'g'),
        header: new RegExp(matGameHeaderPattern, 'g'),
        game: new RegExp(matGamePattern, 'g')
      },
      action: {
        move: new RegExp(matMovePattern),
        cube: new RegExp(matCubePattern),
        action: new RegExp(matActionPattern, 'g'),
        line: new RegExp(matLinePattern, 'g')
      }
    };

  })();
  



  function moveList(r, mv, odd){
    function reformatMove(mv){
      return mv.match(jsboard.movelist.re.data).join('\n');
    };
    debug('moveList', mv);
    var m = mv.match(jsboard.movelist.re.move);
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
            img.attr('src', jsboard.fn.imageURL(data.gnubgid, h, w, jsboard.config.style));
          },
          function out(){
            if (odd){
              a.attr('class', 'movelist-odd-row');
            }else{
              a.attr('class', 'movelist-even-row');
            }
            img.attr('src', jsboard.fn.imageURL(alt, h, w, jsboard.config.style));
          });
        },
      error : function(){
        alert("error");
      }
    });
  };
  

  function matAction(t){
    if (t != ''){
      var move = '';
      var cube = '';
      var resign = '';
      move = (t.match(mat.action.move)||{0:''})[0];
      if (move != ''){
        debug(move);
        return {
          'cube': 0,
          dice: move.slice(0, 2), 
          'move': (move.match(jsboard.movelist.re.move)|| {0:''})[0],
        };
      };
      cube = (t.match(mat.action.cube)||{0:''})[0];
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
    var lines = t.match(mat.action.line);
    for (n in lines){
      var current_move = {};
      var k = lines[n];
      var nth = parseInt(k.slice(0,3));
      var pair = k.match(mat.action.action)
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
      var n = xs[i].match(mat.file.headername)[0];
      var v = xs[i].match(mat.file.headervalue)[0];
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
    matchnavi.headers = matHeader(t.match(mat.file.header));
    matchnavi.match_length = parseInt(t.match(mat.match.header)[0]);
    matchnavi.games = {};
    xs = t.match(mat.game.game);
    for (i in xs){
      var h = (xs[i].match(mat.game.header))[0];
      var p = h.match(mat.game.player);
      var score = {};
      score[0]=  parseInt(p[0].match('\\d+$'));
      score[1]=  parseInt(p[1].match('\\d+$'));
      n = h.match(mat.game.nth)[0];
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

  jsboard.fn.matviewer = function (n){
    debug("jsboard.fn.matviewer processing", n);
    var img;
    var h;
    var w;
    var root = $(this);
    var text = root.text();
    var cursor = matMatchCursor();
    
    jsboard.fn.image(root, '', jsboard.config.style, '#matviewer');
    img = root.find("img");
    w = img.attr('width');
    h = img.attr('height');

    cursor.bind(matFile(text), function(){
      img.attr('src', jsboard.fn.imageURL(cursor.gnubgid, h, w, jsboard.config.style));
    }, function(){
      cursor.next(); // forcing very first to be loaded
      img.click(function(){
        cursor.next();
      });
    });
  };


  jsboard.fn.board = function(n){
    debug("jsboard.fn.board processing", n);
    var id_str =  'jsboard'+n;
    var root = $(this);
    var text = root.text();
    var gnubgid = jsboard.gnubg.find(text);
    var mvlist = text.match(jsboard.movelist.re.list);

    root.empty(); //clean

    jsboard.fn.image(root, gnubgid, jsboard.config.style, '#'+id_str);

    root.append($('<map name="' + id_str + '" id="'+ id_str + '" />'));

    var mv;
    for (n in  mvlist){
      mv = mvlist[n];
      moveList(root, mv, n%2);
    };
  };

  jsboard.fn.player = function(n){
    var map = $('#' + id_str);
    jsboard.fn.area(map, "13pt", "rect", "25,5,43,93", "13pt");
    jsboard.fn.area(map, "7pt", "rect", "115,139,133,227", "7pt");
    jsboard.fn.area(map, "yourbar", "rect", "133,116,158,228", "yourbar");
  };

  function editor(n){
  };


  jsboard.fn.loadCSS = function (src, delay, onload, error){
    debug('loadCSS', src);
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
  debug(jsboard.config.css);
  $(document).ready(function(){
    jsboard.fn.loadCSS(jsboard.config.css, jsboard.config.delay, 
    function(){
      debug('processing.');
      $('.jsboard').each(jsboard.fn.board);
      $('.jsmatviewer').each(jsboard.fn.matviewer);
    }, 
    function (XMLHttpRequest, testStatus, errorThrown){
      debug('css load failed: '+ jsboard.config.css);
    }); 
  });
})(jQuery, jsboard);


