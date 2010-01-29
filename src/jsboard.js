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
      config : {
        move_api_url : "http://move.api.backgammonbase.com/",
        debug: true,
        },
  };
  jsboard = jsboard || def;
  $.extend(def, jsboard);
  jsboard = def;
  
  function imageURL(gnubgid, height, width, css){
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
    img.attr("src", imageURL(gnubgid, h, w, css));
  };

  function area(map, id, shape, coords, alt){
    map.append($('<a id="'+ id 
               + '" shape="' + shape 
               + '" coords="' + coords 
               + '" alt="' + alt 
               + '" nohref="nohref" />'));
  };
  

  var rPositionID = new RegExp("Position ID: ([A-Za-z0-9/+]{14})")
  var rMatchID = new RegExp("Match ID: ([A-Za-z0-9/+]{12})")
  var rGnubgID = new RegExp("[A-Za-z0-9/+]{14}:[A-Za-z0-9/+]{12}")

  function gnubgIDFinder(t){
    var pos;
    var match;
    var e;
    if (t) {
      try{
        pos = t.match(rPositionID)[1];
        match = t.match(rMatchID)[1];
        if ( pos && match ){
          return pos + ':' + match;
        };
      }catch(e){
        //surpress error try other.
      };
      try{
        var gnubgid = t.match(rGnubgID);
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
            img.attr('src', imageURL(data.gnubgid, h, w, jsboard.style));
          },
          function out(){
            if (odd){
              a.attr('class', 'movelist-odd-row');
            }else{
              a.attr('class', 'movelist-even-row');
            }
            img.attr('src', imageURL(alt, h, w, jsboard.style));
          });
        },
      error : function(){
        alert("error");
      }
    });
  };
  

  var matMovePattern = '(?:[1-6][1-6]:(?: ' + movePattern + ')* *)';
  var matMoveRegExp = new RegExp(matMovePattern);
  var matCubePattern = '(?: (Takes *)|(Doubles => \\d+ *)|(Drops *))'
  var matCubeRegExp = new RegExp(matCubePattern);
  var matResignPattern = '(?:( [?]{3} *))';
  var matActionPattern = '(?:'+ matMovePattern + '|' + matCubePattern + ')';
  var matActionRegExp = new RegExp(matActionPattern, 'g')
  var matLinePattern = '(?:[1-9 ][0-9 ][0-9]\\) ' + matActionPattern + matActionPattern + ')';
  //  1) 41: 24/23 13/9              43: 13/9 24/21              
  //  8) 53: 24/21 13/8               Doubles => 2               
  //  9)  Takes                      62: 13/7 13/11              
  var matLineRexExp = new RegExp(matLinePattern, 'g');

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

  function matFinder(t){
    var gamenavi = {};
    var lines = t.match(matLineRexExp);
    for (n in lines){
      var k = lines[n];
      //var nth = $.trim(k.slice(0,3));
      var nth = parseInt(k.slice(0,3));
      //debug('%d %d', n, nth);
      var pair = k.match(matActionRegExp)
      //debug('%d %s %s', n, pair[0].slice(0, 2), pair[0].match(moveRegexp));
      //debug('%d %s %s', n, pair[1].slice(0, 2), pair[1].match(moveRegexp));
      var movenamvi = {};
      debug(pair);
      debug(pair[0]);
      debug(pair[1]);
      movenamvi[0] = matAction(pair[0]);
      movenamvi[1] = matAction(pair[1]);
      movenamvi.nth = nth;

      gamenavi[n] = movenamvi;
    };

    return gamenavi;
  };

  function make_matviewer(n){
    var root = $(this);
    var text = root.text();
    var mat = matFinder(text);
    var root = $(this);

    var img;
    var h;
    var w;

    var cursor = {
      nth: undefined,
      on_action: undefined,
      cube_action: undefined,
      gnubgid: undefined,
      movenamvi: undefined,
      mat: undefined,
      bind: function(mat, on_success){
        var self = this; //ugh!
        debug(mat);
        this.mat = mat;
        if (this.mat[0][0].dice){
          this.nth = 0;
          this.on_action = 0;
          this.cube_action = true;
        }else{
          this.nth = 0;
          this.on_action = 1;
          this.cube_action = true;
        };
        $.ajax({
          url: jsboard.config.move_api_url,
          dataType : "jsonp",
          cache : false,
          'data' : {
            'new': '0:0-0/5',
          }, 
          async: false,
          success : function(data, dataType){
            self.gnubgid = data.gnubgid; //ugh!
            on_success();
          }
        });
      },
      read: function(){
        var movenamvi = this.mat[this.nth][this.on_action];
        debug(movenamvi, this.nth, this.on_action);
        if (this.cube_action){
          data = {
            'cube' : 'no double',
            'dice' : movenamvi.dice, 
            'gnubgid' : this.gnubgid,
            'pickupdice' : false
          };
        }else{
          data = {
            'move' : movenamvi.move, 
            'gnubgid' : this.gnubgid,
            'pickupdice' : true
          };
        };
        return data;
      },
      next: function(on_success){
        var self = this; // ugh!

        $.ajax({
          url: jsboard.config.move_api_url,
          dataType : "jsonp",
          cache : false,
          'data' : this.read(),
          success : function (data, dataType){
            self.gnubgid = data.gnubgid
            on_success();
          },
        });
        if (this.on_action){
          if(this.cube_action){
            // cube done.
            this.cube_action = false;
          }else{
            // moved
            this.cube_action = true;
            this.on_action = 0;
            this.nth += 1;
          };
        }else{
          if(this.cube_action){
            // cube done.
            this.cube_action = false;
          }else{
            // moved
            this.cube_action = true;
            this.on_action = 1;
          };
        };
      },
    };


    cursor.bind(mat, function(){
      debug('cursor:bind with:', cursor);
      image(root, cursor.gnubgid, jsboard.style, '#matviewer');
      img = root.find("img");
      w = img.attr('width');
      h = img.attr('height');
      img.attr('src', imageURL(cursor.gnubgid, h, w, jsboard.style));
      img.click(function(){
        cursor.next(function(){
          img.attr('src', imageURL(cursor.gnubgid, h, w, jsboard.style));
        });
      });
    });

  };

  function viewer(n){
    var id_str =  'jsboard'+n;

    var root = $(this);

    var text = root.text();
    var gnubgid = gnubgIDFinder(text);
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


