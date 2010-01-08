#!/usr/bin/python

import StringIO
import Cookie
import cgi

from twisted.internet import reactor, protocol

import werkzeug as wz
from werkzeug.routing import Map, Rule, NotFound, RequestRedirect
from werkzeug.contrib.sessions import FilesystemSessionStore
from werkzeug.exceptions import HTTPException


from cometd import make


url_map = Map() #place folder?
def expose(rule, **kw):
  def decorate(f):
    kw['endpoint'] = f.__name__
    url_map.add(Rule(rule, **kw))
    return f
  return decorate

store = FilesystemSessionStore()

class Web:
  @expose('/')
  def top(self, request):
    return  wz.Response('top', mimetype='text/plain')

  @expose('/lobby')
  def lobby(self, request):
    sid = request.cookies.get('session_id')
    if sid is None:
      return wz.redirect('/login', 301)
    return  wz.Response('lobby', mimetype='text/plain')
  
  @expose('/login')
  def login(self, request):
    sid = request.cookies.get('session_id')
    if sid is None:
      cookie = store.new()  
    else:
      cookie = store.get(sid)  
      # already logged in
      return wz.redirect('/lobby', 301)
  
    r = wz.Response('login', mimetype='text/plain')
    r.set_cookie('session_id', cookie.sid)
    return r

  @expose('/logout')
  def logout(self, request):
    sid = request.cookies.get('session_id')
    if sid is None:
      return wz.redirect('/', 301)
    else:
      cookie = store.get(sid)  
      store.delete(cookie)
  
    r = wz.Response('logout', mimetype='text/plain')
    r.set_cookie('session_id', cookie.sid, expires=0.0)
    return r

  @expose('/room/<int:room>')
  def room(self, request, room):
    return  wz.Response('room %i'%(room, ), mimetype='text/plain')

  def __call__(self, environ, start_response):
    self.server = environ['DualServer']
    request = wz.Request(environ)
    adapter = url_map.bind_to_environ(environ)
    try:
      endpoint, values = adapter.match()
      handler = getattr(self, endpoint)
      response = handler(request, **values)

    except HTTPException, e:
      return e(environ, start_response)
    return wz.ClosingIterator(response(environ, start_response))


def comet(environ, start_response):
  print 'comet(request)'
  request = wz.Request(environ)
  return request.cookies.get('session_id')
  

web=Web()
web, comet = make((3124, web), (3165, comet))


reactor.listenTCP(3124, web)
reactor.listenTCP(3165, comet)
reactor.run()


