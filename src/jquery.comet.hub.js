//
//  Copyright 2010 Noriyuki Hosaka bgnori@gmail.com
//

//
// dependencies: jquery.js
//

var hub = hub || {}; //global

(function($) {
  function debug(msg){
    console.log(msg);
  };

  var config = {
    host : 'localhost',
    comet_port: 3165,
    http_port: 3124,
  };
  var handlers = {};

  function buildparam(kwargs){
    var r = '';
    var k = '';
    for (k in kwargs){
      r += (k + '=' + kwargs[k]);
    };
    debug('buildparam:'+r);
    return r;
  };

  function urlunparse(kwargs){
    var d = {
      scheme: 'http', 
      hostname: 'localhost',
      port: '',
      username: '',
      password: '',
      path: '/', 
      params: '',
    };
    $.extend(d, kwargs);
    if (d.username && d.password){
      0/0;
    }else{
      return  d.scheme + '://' + d.hostname + ':' + d.port + 
              d.path + '?' + buildparam(d.params);
    };
  };


  hub.init = function(kwargs){
    $.extend(config, kwargs);
    debug('built config.');
    debug(config);

    hub.listen();
    debug('hub has started listening.');
  };

  hub.listen = function() {
    var url = urlunparse({
      scheme: 'http',
      hostname: config.host,
      port: config.comet_port,
    });
    debug('listen to ' + url);
    $.ajax({
      url: url,
      dataType : "jsonp",
      type: "GET", // JSONP is <script> loading, nothing else.
      cache : false,
      data : {},
      timeout: 60*1000,
      success : function (data, dataType){
        var c = data['channel'];
        var m = data['message'];
        debug(c);
        debug(m);
        h = handlers[c];
        debug(h);
        h(m);
        hub.listen();
      },
      error : function(){
        alert("error");
      }
    });
  };

  hub.subscribe = function(channel, handler) {
    var url = urlunparse({
      scheme: 'http',
      hostname: config.host,
      port: config.http_port,
      path: channel,
      params : {
        command:'subscribe',
      }
    });
    debug('subscribe to ' + url);
    $.ajax({
      url: url,
      type: "POST", 
      cache : false,
      contentType: "application/x-www-form-urlencoded",
      data : {},
      timeout: 60*1000,
      success : function (data, dataType){
        handlers[channel] = handler; // ugh!
      },
      error : function(){
        alert("error");
      },
    });
  };

  hub.publish = function(channel, message, onSuccess ,onError) {
    var url = urlunparse({
      scheme: 'http',
      hostname: config.host,
      port: config.http_port,
      path: channel,
      params : {
        command:'publish',
      }
    });
    debug('publish to ' + url);
    $.ajax({
      url: url,
      type: "POST", 
      cache : false,
      contentType: "application/x-www-form-urlencoded",
      data :{
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

