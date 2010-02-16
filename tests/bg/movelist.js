example('正規表現 movelist 2ply編', function() {
  value_of('    1. Cubeful 2-ply    24/22 13/9                   Eq.:  -0.151'
        +  '       0.425 0.125 0.005 - 0.575 0.192 0.009'
        +  '        2-ply cubeful prune [world class]'
  ).should_match(jsboard.movelist.re.move);
  value_of('    1. Cubeful 2-ply    24/22 13/9                   Eq.:  -0.151'
        +  '       0.425 0.125 0.005 - 0.575 0.192 0.009'
        +  '        2-ply cubeful prune [world class]'
  ).should_match(jsboard.movelist.re.list);
  value_of('    1. Cubeful 2-ply    24/22 13/9                   Eq.:  -0.151'
        +  '       0.425 0.125 0.005 - 0.575 0.192 0.009'
        +  '        2-ply cubeful prune [world class]'
  ).should_match(jsboard.movelist.re.data);
});



example('正規表現 movelist rollout編', function() {
  value_of('    2. Rollout          13/4                         Eq.:  +0.8026 ( -0.0765)'
        +  '       0.8893 0.0431 0.0012 - 0.1107 0.0072 0.0003 CL  +0.8472 CF  +0.8026'
        +  '      [0.0035 0.0039 0.0008 - 0.0035 0.0012 0.0003 CL   0.0110 CF   0.0130]'
        + '        Full cubeful rollout with var.redn.'
        + '        146 games, Mersenne Twister dice gen. with seed 717406193 and quasi-random dice'
        + '        Play: world class 2-ply cubeful prune [world class]'
        + '        keep the first 0 0-ply moves and up to 8 more moves within equity 0.16'
        + '        Skip pruning for 1-ply moves.'
        + '        Cube: 2-ply cubeful prune [world class]'
  ).should_match(jsboard.movelist.re.move);

  value_of('    2. Rollout          13/4                         Eq.:  +0.8026 ( -0.0765)'
        +  '       0.8893 0.0431 0.0012 - 0.1107 0.0072 0.0003 CL  +0.8472 CF  +0.8026'
        +  '      [0.0035 0.0039 0.0008 - 0.0035 0.0012 0.0003 CL   0.0110 CF   0.0130]'
        + '        Full cubeful rollout with var.redn.'
        + '        146 games, Mersenne Twister dice gen. with seed 717406193 and quasi-random dice'
        + '        Play: world class 2-ply cubeful prune [world class]'
        + '        keep the first 0 0-ply moves and up to 8 more moves within equity 0.16'
        + '        Skip pruning for 1-ply moves.'
        + '        Cube: 2-ply cubeful prune [world class]'
  ).should_match(jsboard.movelist.re.list);

  value_of('    2. Rollout          13/4                         Eq.:  +0.8026 ( -0.0765)'
        +  '       0.8893 0.0431 0.0012 - 0.1107 0.0072 0.0003 CL  +0.8472 CF  +0.8026'
        +  '      [0.0035 0.0039 0.0008 - 0.0035 0.0012 0.0003 CL   0.0110 CF   0.0130]'
        + '        Full cubeful rollout with var.redn.'
        + '        146 games, Mersenne Twister dice gen. with seed 717406193 and quasi-random dice'
        + '        Play: world class 2-ply cubeful prune [world class]'
        + '        keep the first 0 0-ply moves and up to 8 more moves within equity 0.16'
        + '        Skip pruning for 1-ply moves.'
        + '        Cube: 2-ply cubeful prune [world class]'
  ).should_match(jsboard.movelist.re.data);
});

