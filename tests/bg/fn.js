
example('関数imageURLはgnubgidとwidthとheightとcssを与えられた時に対応する画像を返すURLを生成する。', function(){
  value_of(jsboard.fn).should_include('imageURL');
  value_of(jsboard.fn.imageURL('gnubgid', 300, 400, 'hoge'))
    .should_be('http://image.backgammonbase.com/image?gnubgid=gnubgid&height=300&width=400&css=hoge&format=png');
});

