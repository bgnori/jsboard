/* 
  This script requires jQuery 1.3.2   
  Copyright 2009 Noriyuki Hosaka bgnori@gmail.com
*/


(function($){
  function debug(msg){
    if (window['console']){
      console.log(msg);
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

  function gnubgIDFinder(text){
    var pos;
    var match;
    var e;
    if (text) {
      try{
        pos = text.match(rPositionID)[1];
        match = text.match(rMatchID)[1];
        if ( pos && match ){
          return pos + ':' + match;
        };
      }catch(e){
        //surpress error try other.
      };
      try{
        var gnubgid = text.match(rGnubgID);
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

  var MoveDataPattern = '(?:(?: ){4}' 
   +  '(?:(?: ){3}'
   +    allEquityPattern + CFCLPattern + '?'
   +  ')|'
   +  '(?:(?: ){2}'
   +    '\\[' + allEquityPattern + CFCLPattern + '\\]'
   +  ')|'
   +  '(?:(?: ){4}'
   +    '(?:Full cubeful rollout with var\\.redn\\.)|'
   +    '(?:\\d+-ply cubeful prune \\[\\w+ class\\])|'
   +    '(?:\\d+ games, Mersenne Twister dice gen\\. with seed \\d+ and quasi-random dice)|' 
   +    '(?:Play: \\w+ class \\d+-ply cubeful prune \\[\\w+ class\\])|'
   +    '(?:keep the first \\d+ \\d+-ply moves and up to \\d+ more moves within equity '+floatPattern +')|'
   +    '(?:Skip pruning for \\d+-ply moves\\.)|'
   +    '(?:Cube: \\d+-ply cubeful prune \\[\\w+ class\\])'
   +  ')'
   +')';
  debug(MoveDataPattern);
  var MoveDataRegExp = new RegExp(MoveDataPattern, 'g');
  var MoveListingPattern = MoveHeaderPattern + Line + '?' + '(?:' + MoveDataPattern + Line +'?'+ ')*';
  debug(MoveListingPattern);
  var MoveListingRegExp = new RegExp(MoveListingPattern, 'g');

  var MoveHeaderOrDataPattern = MoveHeaderPattern + '|' + MoveDataPattern ;
  var MoveHeaderOrDataRegExp = new RegExp(MoveHeaderOrDataPattern, 'g');

  function moveFinder(text){
    var m = text.match(MoveListingRegExp);
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
  
  function editor(n){
    var id_str =  'jsboard'+n;

    var root = $(this);

    var text = root.text();
    var gnubgid = gnubgIDFinder(text);
    var mvlist = moveFinder(text);

    root.empty(); //clean

    image(root, gnubgid, jsboard.style, '#'+id_str);

    root.append($('<map name="' + id_str + '" id="'+ id_str + '" />'));
    var map = $('#' + id_str);
    area(map, "13pt", "rect", "25,5,43,93", "13pt");
    area(map, "7pt", "rect", "115,139,133,227", "7pt");
    area(map, "yourbar", "rect", "133,116,158,228", "yourbar");


    var mv;
    for (n in  mvlist){
      mv = mvlist[n];
      moveList(root, mv, n%2);
    };
  }

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
      $('.jsboard').each(editor);
    }, 
    function (XMLHttpRequest, testStatus, errorThrown){
      debug('css load failed: '+ jsboard.css);
    }); 
  });
})(jQuery);


