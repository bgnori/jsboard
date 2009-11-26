/* 
  This script requires jQuery 1.3.2   
  Copyright 2009 Noriyuki Hosaka bgnori@gmail.com
*/


function ImageURL(gnubgid, height, width, css){
  return 'http://image.backgammonbase.com/image?' + 
    'gnubgid=' +  encodeURIComponent(gnubgid) + 
    '&height='+height +
    '&width='+width + 
    '&css='+ css +
    '&format=png';
};


function Image(r, gnubgid, height, width, css, usemap){
  r.append($('<img src="'+ImageURL(gnubgid, height, width, css) 
           +'" alt=gnubgid usemap="'+ usemap 
           +'" width="' + width 
           + '" height="' + height + '" />'));
};

function Area(map, id, shape, coords, alt){
  map.append($('<a id="'+ id 
             + '" shape="' + shape 
             + '" coords="' + coords 
             + '" alt="' + alt 
             + '" nohref="nohref" />'));
};

function DebugDump(r, id){
  debug_textarea = '<form><textarea cols="60" rows="5">debugger\n</textarea></form>';
  r.append(debug_textarea);

  r.find('#' +id +' a').mousedown(function(){
    //alert($(this).attr("alt"));  //-> ok
    debug = r.find("form textarea");
    //alert(debug.attr('cols')); -> 60, ok
    old = debug.val()
    //debug.val(old + 'mousedown at hoge');
    debug.val(old + 'mousedown at ' + $(this).attr("alt") + ' \n');
    })
};

rPositionID = new RegExp("Position ID: ([A-Za-z0-9/+]{14})")
rMatchID = new RegExp("Match ID: ([A-Za-z0-9/+]{12})")
rGnubgID = new RegExp("[A-Za-z0-9/+]{14}:[A-Za-z0-9/+]{12}")

function GnubgIDFinder(){
  text = root.text();
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
      gnubgid = text.match(rGnubgID);
      if (gnubgid){
        return gnubgid;
      }
    }catch(e){
      //surpress error and use default value
    };
  }
  return '4HPwATDgc/ABMA:cAkAAAAAAAAA';
  //return '4PPgAQPgc+QBIg:cAl7AAAAAAAA';
};

function Editor(n){
  id_str =  'jsboard'+n;

  root = $(this);

  Image(root, GnubgIDFinder(root), 252, 341, 'nature', '#'+id_str);

  root.append($('<map name="' + id_str + '" id="'+ id_str + '" />'));
  map = $('#' + id_str);
  //alert(map.attr('id')); -> ok
  Area(map, "13pt", "rect", "25,5,43,93", "13pt");
  Area(map, "7pt", "rect", "115,139,133,227", "7pt");
  Area(map, "yourbar", "rect", "133,116,158,228", "yourbar");

  DebugDump(root, id_str);

}

$(document).ready(function(){
  $('.jsboard').each(Editor);
});

