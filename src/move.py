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

    gnubgid = q['gnubgid'][0]
    movetext = q['move'][0]
    pid, mid = gnubgid.split(':')

    print >>sys.stderr, 'got:', gnubgid, movetext
    print >>sys.stderr, pid, mid
    assert len(pid) == 14
    #01234567890123
    #sGfwgAPbuIEDIA
    assert len(mid) == 12
    #01234567890123
    #cIkqAAAAAAAA

    b = BoardEditor()
    decode(b, pid, mid)
  
    moves = movetext.split(' ')
    mf = MoveFactory(b)

    for mv in moves:
      print >>sys.stderr, mv
      if mv:
        d = moveRegExp.search(mv).groupdict()
        n = int(d['multi'] or '1')
        while n > 0:
          found = mf.guess_your_multiple_pms(move_pton(d['src']),
                                             move_pton(d['dest']))
          assert found
          #assert not d['hitting'] or n!=1 or found.is_hitting 
          mf.add(found)
          #mf.append(found)
          n = n -1;

    assert mf.is_leagal_to_pickup_dice()
    p, m = encode(mf.board)
    assert len(p) == 14
    assert len(m) == 12

  
    value = {"status": True, "gnubgid": "%s:%s"%(p, m)}
    j = '%s(%s);'%(q['callback'][0], simplejson.dumps(value))
    print >>stdout, j
    print >>sys.stderr, 'sending:' ,j
    start_response("200 OK", [('Content-Type','text/javascript')])
    return [stdout.getvalue()]


if __name__ == '__main__':
  httpd = make_server('', 8000, app);
  httpd.serve_forever();

