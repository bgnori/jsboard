#!/usr/bin/python

import StringIO
import Cookie
import cgi

from twisted.internet import reactor, protocol
from cometd import make

def parseCookies(s):
  #ugh!
  cookies = {}
  #for x in [t.strip() for t in s.replace(",", ":").split(":")]:
  #  if x == "":
  #    continue
  #  key,value = x.split("=", 1)
  #  cookies[key] = value
  return cookies

def web(environ, start_response):
  print 'web... usual wsgi part'
  stdout = StringIO.StringIO()
  q = cgi.parse_qs(environ['QUERY_STRING'])
  cookies = parseCookies(environ.get("HTTP_COOKIE", ""))

  method = environ['REQUEST_METHOD']
  print method
  assert method == 'POST' 
  # every command changes the server state
  # so we must use POST

  command = q['command'][0] #ugh!
  channel = environ['PATH_INFO'] # path to channel mapping
  print channel

  dual = environ['DualServer']

  #needs error handling. just redirect to login page
  try:
    session_id = cookies['session_id']
    assert session_id is not None
  except:
    print >> stdout, 'needs login'
    start_response("200 OK", [('Content-Type','text/html')])
    return [stdout.getvalue()]
  session = dual.find(session_id)


  if command == 'subscribe':
    session.subscribe(channel)
    print >> stdout, ''
    start_response("200 OK", [('Content-Type','text/html')])
    return [stdout.getvalue()]

  elif  command == 'publish':
    length = int(environ.get('CONTENT_LENGTH', 0))
    input = environ['wsgi.input']
    raw = input.read(length)
    print 'wsgi.input:', repr(raw)
    data = cgi.parse_qs(raw)
    print 'data:', data
    message = data['message'][0] or ''
    dual.comet(channel, message)

    print >> stdout, ''
    start_response("200 OK", [('Content-Type','text/html')])
    return [stdout.getvalue()]

  elif  command == 'login':
    length = int(environ.get('CONTENT_LENGTH', 0))
    input = environ['wsgi.input']
    raw = input.read(length)
    print 'wsgi.input:', repr(raw)
    data = cgi.parse_qs(raw)

    print >> stdout, '<html><head>cookie</head>'
    print >> stdout, '<body>login done. set cookie'
    print >> stdout, '<a href="http://comet.backgammonbase.test:8080/jquery.comet.chat.html">continue test</a>'
    print >> stdout, '</body></html>'
    c = Cookie.SmartCookie()
    c['session_id'] = '1'
    c['path'] = '/'
    c['domain'] = '.backgammonbase.test'
    c['expire'] = ''

    start_response("200 OK", 
            [('Content-Type','text/html'), 
             ('Set-Cookie', c.output(header=""))])
    return [stdout.getvalue()]

  else:
    pass

  # What going on???
  print >> stdout, 'unknown command'
  start_response("200 OK", [('Content-Type','text/html')])
  return [stdout.getvalue()]


def comet(environ, start_response):
  print 'comet'
  q = cgi.parse_qs(environ['QUERY_STRING'])
  cookies = parseCookies(environ.get("HTTP_COOKIE", ""))

  def request():
    print 'comet(request)'
    # wanna fail in case of no cookie.
    # may be redirect?
    cookies['session_id']
    return 1 #session_id
  
  def response(channel, message):
    stdout = StringIO.StringIO()
    print 'comet(response)'
    value = {'message':message, 'channel':channel}
    j = '%s(%s);'%(q['callback'][0], simplejson.dumps(value))
    print >> stdout, j
    start_response("200 OK", [('Content-Type','text/javascript')])
    return [stdout.getvalue()]
  return request, response

web, comet = make((3124, web), (3165, comet))


reactor.listenTCP(3124, web)
reactor.listenTCP(3165, comet)
reactor.run()


