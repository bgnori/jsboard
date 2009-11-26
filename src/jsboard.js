/* 
  This script requires jQuery 1.3.2   
  Copyright 2009 Noriyuki Hosaka bgnori@gmail.com
*/



function Image(r, gnubgid, height, width, css, usemap){
  r.append('<img src="http://image.backgammonbase.com/image?gnubgid=4PPgAQPgc%2BQBIg%3AcAl7AAAAAAAA&height=262&width=341&css=nature&format=png" alt=gnubgid usemap="'+usemap+'" width="341" height="262" />');
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

function Editor(n){
  id_str =  'jsboard'+n;

  root = $(this);

  Image(root, 'gnubgid', 341, 252, 'css', '#'+id_str);

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

