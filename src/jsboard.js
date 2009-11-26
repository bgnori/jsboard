/* 
  This script requires jQuery 1.3.2   
  Copyright 2009 Noriyuki Hosaka nori@backgammon.gr.jp
*/

/* 

  $('#debug').val('debugger ready!\n');
  $('#jsboard area').mousedown(function(){
    var debug = $('#debug');
    old = debug.val()
    debug.val(old + 'mousedown at ' + $(this).attr("alt") + ' \n');
    })
  });
*/
debug_textarea = '<form><textarea cols="60" rows="5" id="debug"></textarea></form>';

function Editor(n){
  $(this).append(debug_textarea);
};


$(document).ready(function(){
  $('.jsboard').each(Editor);
});

