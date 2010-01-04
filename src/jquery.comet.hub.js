//
//  Copyright 2010 Noriyuki Hosaka bgnori@gmail.com
//

//
// dependencies: jquery.js
//

var hub = hub || {}; //global, namespace contamination

(function($) {
  function debug(msg){
    console.log(msg);
  };
  var conn;
  var http_url;
  var comet_url;
  //hub.fn = hub.prototype;


  hub.init = function(host, comet_port, http_port) {
    http_url = 'http://' + host + ':' + http_port + '/publish';
    comet_url = 'http://' + host + ':' + comet_port;
    hub.listen();
    debug('hub has started listening.');
  };

  hub.listen = function() {
    $.ajax({
      url: comet_url, //"http://comet.backgammonbase.test:3165",
      dataType : "jsonp",
      type: "GET", // JSONP is <script> loading, nothing else.
      cache : false,
      data : {},
      timeout: 60*1000,
      success : function (data, dataType){
        c = data['channel'];
        for (h in hub[c]) { //ugh!
          h(data['message']);
        };
        hub.listen();
      },
      error : function(){
        alert("error");
      }
    });
  };

  hub.subscribe = function(channel, handler) {
    $.ajax({
      url: http_url, //"http://comet.backgammonbase.test:8080/subscribe", 
      type: "POST", 
      cache : false,
      contentType: "application/x-www-form-urlencoded",
      data : {
        channel:channel,
        action:"subscribe",
      },
      timeout: 60*1000,
      success : function (data, dataType){
        hs = hub.get(channel) || []; // ugh!
        hs.append(handler);
      },
      error : function(){
        alert("error");
      },
    });
  };

  hub.publish = function(channel, message, onSuccess ,onError) {
    $.ajax({
      url: http_url, //"http://comet.backgammonbase.test:8080/publish", 
      type: "POST", 
      cache : false,
      contentType: "application/x-www-form-urlencoded",
      data : {
        channel:channel, 
        action:"publish",
        message:message, 
      },
      success : onSuccess,
      error : onError,
    });
  };


  debug(hub.init);
  debug(hub.listen);
  debug(hub.subscribe);
  debug(hub.publish);
  debug('jquery.comet.hub.js has been loaded.');

})(jQuery);

