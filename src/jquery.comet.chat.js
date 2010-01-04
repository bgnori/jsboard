//
//  Copyright 2009-2010 Noriyuki Hosaka bgnori@gmail.com
//

//
// dependencies: jquery.comet.hub.js
//

(function($) {
  function debug(msg){
    console.log(msg);
  };
  var template = '<div class="comet-chat-container"> container' +
                   '<div>' + 
                     '<div class="comet-chat-room">roomName</div>' +
                     '<div class="comet-chat-content">content</div>' +
                   '</div>' + 
                   '<form class="comet-chat-form">' +
                     '<input type="text" class="comet-chat-form-text"/>' + 
                     '<input type="submit" class="comet-chat-form-submit"/>' +
                   '</form>' +
                 '</div>';
  $.fn.chatForm = function(room) {
    $(this).append($(template));
    debug(this);
    var c = $(this).find(":last-child");
    debug(c);
    var r = $(c).find('.comet-chat-room');
    debug(r);
    r.text(room);

    var f = c.find('.comet-chat-form');
    f.submit(function(){
      t = f.find('.comet-chat-form-text')
      var d = $t.val();
      hub.publish(room, d, 
        function(){
          $('#content').val('');
        },
        function(){
          debug('failed to post message.' + d);
        });
      return false;
    });

    var content = $(c).find('.comet-chat-content');
    hub.subscribe(room, function(message){
      content.append($("<div>" + message + "</div>"));
    });
  };
  debug('jquery.comet.chat.js has been loaded.');
})(jQuery);

