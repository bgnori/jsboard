
example('jsboard.configの定義。', function() {
  value_of(jsboard).should_include('config');
  value_of(jsboard.config).should_include('style');
  value_of(jsboard.config).should_include('delay');
  value_of(jsboard.config).should_include('css');
  value_of(jsboard.config).should_include('move_api_url');
});
