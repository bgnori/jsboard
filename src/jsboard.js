/* 
  This script requires jQuery 1.4.0
  Copyright 2009 Noriyuki Hosaka bgnori@gmail.com
*/


(function ($){
  function debug(){
    if (window['console']){
      console.log.apply(null, arguments);
    };
  };

  if (typeof(jsboard) == 'undefined'){
    jsboard = {};
  };
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
    debug('jsboard.fn.imageURL', gnubgid, height, width, css);
    return 'http://image.backgammonbase.com/image?' + 
      'gnubgid=' +  encodeURIComponent(gnubgid) + 
      '&height='+height +
      '&width='+width + 
      '&css='+ css +
      '&format=png';
  };

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
    gnubgid = gnubgid || '4HPwATDgc/ABMA:cAkAAAAAAAAA';
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

    jsboard.movelist.pattern = {
      //putting pattern in name space gives so little.
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

    jsboard.movelist.create = function(r, mv, odd){
      function reformatMove(mv){
        return mv.match(jsboard.movelist.re.data).join('\n');
      };
      debug('jsboard.movelist.create', mv);
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
  })();


  /*
   *
   *    jsboard.mat
   *
   */
  (function(){
    jsboard.mat = {};
    jsboard.mat.pattern = {
      //Ugh!
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
        +   'Player 1 Elo|'
        +   'Player 2 Elo|'
        +   'Player 1|'
        +   'Player 2|'
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
    var matMovePattern = '(?:[1-6][1-6]:(?: ' + jsboard.movelist.pattern.move + ')* +)';
    var matCubePattern = '( (?:(?:Takes {21})|(?:Doubles => \\d[0-9 ]{14})|(?:Drops {21})))'
    var matResignPattern = '(?:( [?]{3} *))';
    //var matActionPattern = '(?:'+ matMovePattern + '|' + matCubePattern + ')';
    var matActionPattern = '(?:'+ matMovePattern + '|' + matCubePattern + '|(?: ){28})';
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


    jsboard.mat.parser = {};

    jsboard.mat.parser.action = function(t){
      //if (((typeof t) != 'undefined') && (t != null) && (t != '')){
      if (typeof t == 'string'){
        var move = '';
        var cube = '';
        var resign = '';
        var m = t.match(jsboard.mat.re.action.move);
        if ((m=== null) || (typeof m == 'undefined') ){
          move = '';
        }else{
          debug(m);
          move = m[0];//(t.match(jsboard.mat.re.action.move)||{0:''})[0];
        };
        if (move != ''){
          debug(move);
          return {
            'cube': 0,
            dice: move.slice(0, 2), 
            'move': (move.match(jsboard.movelist.re.move)|| {0:''})[0],
          };
        };
        cube = (t.match(jsboard.mat.re.action.cube)||{0:''})[0];
        if (cube != ''){
          return {
            'cube': cube,
          };
        };
      }else{
        return {};
      };
    };

    jsboard.mat.parser.moves = function (t){
      var r = {};
      var lines = t.match(jsboard.mat.re.action.line);
      debug('jsboard.mat.parser.moves', t.slice(0,50));
      for (n in lines){
        var current_move = {};
        var k = lines[n];
        var nth = parseInt(k.slice(0,3));
        var pair = k.match(jsboard.mat.re.action.action)
        debug('jsboard.mat.paser.moves...', pair);
        current_move[0] = jsboard.mat.parser.action(pair[0]);
        current_move[1] = jsboard.mat.parser.action(pair[1]);
        current_move.nth = nth;
        r[n] = current_move;
      };
      return r;
    };

    jsboard.mat.parser.headers = function (t){
      var r = {};
      var i;
      var xs = t.match(jsboard.mat.re.file.header);
      debug('jsboard.mat.parser.headers', xs);
      for (i in xs){
        var n = xs[i].match(jsboard.mat.re.file.headername)[0];
        var v = xs[i].match(jsboard.mat.re.file.headervalue)[0];
        v = v.slice(1, -1);
        debug(n, v);
        r[n] = v;
      };
      return r;
    };

    jsboard.mat.parser.file = function (t){
      var matchnavi = {};
      var xs;
      var i;
      debug('jsboard.mat.parser.file', t.slice(0,50));
      matchnavi.headers = jsboard.mat.parser.headers(t);
      matchnavi.match_length = parseInt(t.match(jsboard.mat.re.match.header)[0]);
      matchnavi.games = {};
      xs = t.match(jsboard.mat.re.game.game);
      debug(xs);
      for (i in xs){
        var h = (xs[i].match(jsboard.mat.re.game.header))[0];
        var p = h.match(jsboard.mat.re.game.player);
        var score = {};
        var n;
        score[0]=  parseInt(p[0].match('\\d+$'));
        score[1]=  parseInt(p[1].match('\\d+$'));
        n = h.match(jsboard.mat.re.game.nth)[0];
        debug(n);
        matchnavi.games[i] = {
          name: n,
          match_length: matchnavi.match_length,
          nth: parseInt(n.slice(6)),
          moves: jsboard.mat.parser.moves(xs[i]),
          'score': score
        };
        debug(matchnavi.games[i]);
      };
      debug('jsboard.mat.parser.file .. done');
      return matchnavi;
    };
  })();



  jsboard.gameCursor = function (){
    return {
      nth: null,
      on_action: null,
      cube_action: null,
      gnubgid: null,
      current_move: null,
      game: null,
      on_success: null,
      bind: function(game, on_success){
        var self = this; //ugh!
        debug('gameCursor:bind', self);
        self.on_success = on_success;
        self.game = game;
        if (self.game.moves[0][0] && self.game.moves[0][0].dice){
          self.nth = 0;
          self.on_action = 0;
          self.cube_action = true;
        }else{
          self.nth = 0;
          self.on_action = 1;
          self.cube_action = true;
        };
        debug('gameCursor:bind... ajax', self);
        return $.ajax({
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
            debug('gameCursor:bind... ajax success', self);
            self.gnubgid = data.gnubgid; //ugh!
          }
        });
      },
      read: function(){
        var self = this; //ugh!
        debug('gameCursor:read', self);
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
          debug('gameCursor:isDone true', self);
          return true;
        };
        debug('gameCursor:isDone false', self);
        return false;
      },
      next: function(){
        var self = this; // ugh!
        debug('gameCursor:next', self);

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

  function matchCursor(){
    return {
      matchnavi: null,
      current: null,
      nth: null,
      on_success: null,
      gnubgid: '',
      subbind: function(after){
        var self = this;
        debug('matchCursor:subbind', self);
        self.current = gameCursor();
        self.current.bind(self.matchnavi.games[self.nth], function(){
          self.gnubgid = self.current.gnubgid;
          self.on_success();
        }, after);
        return self;
      },
      bind: function(matchnavi, on_success, after){
        var self = this;
        debug('matchCursor:bind', self);
        self.matchnavi = matchnavi;
        self.on_success = on_success;
        self.nth = 0;
        self.subbind(after);
        return self;
      },
      isDone: function(){
        debug('matchCursor:isDone', self);
        return false;
      },
      next: function(){
        var self = this;
        debug('matchCursor:next', self);
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
    var cursor = matchCursor();
    
    jsboard.fn.image(root, '', jsboard.config.style, '#matviewer');
    img = root.find("img");
    w = img.attr('width');
    h = img.attr('height');

    debug('pre bind');
    cursor.bind(jsboard.mat.parser.file(text), function(){
      debug('bind');
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
      jsboard.movelist.create(root, mv, n%2);
    };
  };

  jsboard.fn.player = function(n){
    var map = $('#' + id_str);
    jsboard.fn.area(map, "13pt", "rect", "25,5,43,93", "13pt");
    jsboard.fn.area(map, "7pt", "rect", "115,139,133,227", "7pt");
    jsboard.fn.area(map, "yourbar", "rect", "133,116,158,228", "yourbar");
  };

  jsboard.fn.editor = function(n){
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
})(jQuery);


