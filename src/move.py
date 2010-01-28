#!/usr/bin/env python
# -*- coding: us-ascii -*-
# vim: syntax=python
#
# Copyright 2006-2008 Noriyuki Hosaka nori@backgammon.gr.jp
#
#!/usr/bin/python

import cgi
import sys
import re

from wsgiref.simple_server import make_server, demo_app
import simplejson

from bglib.model.util import move_pton
from bglib.model.boardeditor import BoardEditor
from bglib.model.move  import PartialMove, MoveFactory
from bglib.encoding.gnubgid import decode, encode

pointPattern = r"(?:(?:bar)|(?:[12][0-9]|[0-9])|(?:off))"
movePattern = "(?:(?:" + pointPattern + "/(?:" + pointPattern + "\\*?)+(?:\\([1-4]\\))?) ?)+";

moveRegExp = re.compile(r"(?P<src>" + pointPattern + 
                          ")/(?P<dest>" + pointPattern +
                          ")(?P<hitting>\*)?(\((?P<multi>[1-4])\))?")


def app(environ, start_response):
    from StringIO import StringIO
    stdout = StringIO()
    q = cgi.parse_qs(environ['QUERY_STRING'])

    EMPTY = ('',)
    gnubgid = q.get('gnubgid', EMPTY)[0]
    move = q.get('move', EMPTY)[0]
    cube = q.get('cube', EMPTY)[0]
    pickupdice = q.get('pickupdice', EMPTY)[0]
    dice= q.get('dice', EMPTY)[0]
    pid, mid = gnubgid.split(':')

    print >>sys.stderr, 'got: gnubgid=%s, move=%s, cube=%s pickupdice=%s dice=%s'%(gnubgid, move, cube, pickupdice,  dice)
    print >>sys.stderr, pid, mid
    assert len(pid) == 14
    #01234567890123
    #sGfwgAPbuIEDIA
    assert len(mid) == 12
    #01234567890123
    #cIkqAAAAAAAA

    b = BoardEditor()
    decode(b, pid, mid)
  
    print b
    if b.is_leagal_to_move(b.on_action):
      #ugh! can be empty, DANCE ! assert move 
      moves = move.split(' ')
      mf = MoveFactory(b)
    
      for mv in moves:
        print >>sys.stderr, mv
        if mv:
          m = moveRegExp.search(mv)
          if not m:
            break
          d = m.groupdict()
          print d
          n = int(d['multi'] or '1')
          while n > 0:
            print d['src'], d['dest']
            found = mf.guess_your_multiple_pms(move_pton(d['src']),
                                               move_pton(d['dest']))
            assert found
            #assert not d['hitting'] or n!=1 or found.is_hitting 
            mf.add(found)
            #mf.append(found)
            n = n -1;
    
      assert mf.is_leagal_to_pickup_dice()
    
      if pickupdice:
        print 'pickupdice', pickupdice
        mf.pickupdice()
      print mf.board
      p, m = encode(mf.board)
    elif b.is_leagal_to_roll(b.on_action):
      if cube == 'no double' and dice:
        b.rolled = (int(dice[0]), int(dice[1]))
      elif cube == 'double':
        pass
      print b
      p, m = encode(b)
    else:
      pass
    assert len(p) == 14
    assert len(m) == 12

  
    value = {"status": True, "gnubgid": "%s:%s"%(p, m)}
    j = '%s(%s);'%(q['callback'][0], simplejson.dumps(value))
    print >>stdout, j
    print >>sys.stderr, 'sending:' ,j
    start_response("200 OK", [('Content-Type','text/javascript')])
    return [stdout.getvalue()]


if __name__ == '__main__':
  httpd = make_server('localhost', 8000, app);
  httpd.serve_forever();

