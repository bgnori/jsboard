#!/usr/bin/python

from twisted.internet import reactor, protocol

import werkzeug as wz
from werkzeug.routing import Map, Rule, NotFound, RequestRedirect
from werkzeug.contrib.sessions import FilesystemSessionStore
#from werkzeug.contrib.securecookie import SecureCookie

from werkzeug.exceptions import HTTPException
#from httplib import HTTPException #ugh!

from cometd import make

'''
def demo_app(environ, start_response):
    from StringIO import StringIO
    print 'demo_app'
    stdout = StringIO()
    print >>stdout, "Hello world!"
    print >>stdout
    h = environ.items(); h.sort()
    for k,v in h:
        print >>stdout, k,'=',`v`


    print >>stdout, wz.cookie_date()
    print >>stdout, wz.parse_cookie(environ)#.get("HTTP_COOKIE", ""))
    start_response("200 OK", [('Content-Type','text/plain')])
    return [stdout.getvalue()]
'''

'''
#from werkzeug.routing sample
url_map = Map([
  Rule('/', endpoint='blog/index'),
  Rule('/<int:year>', endpoint='blog/archive'),
  Rule('/<int:year>/<int:month>', endpoint='blog/archive'),
  Rule('/<int:year>/<int:month>/<int:day>', endpoint='blog/archive'),
  Rule('/<int:year>/<int:month>/<int:day>/<slug>', endpoint='blog/show_post'),
  Rule('/about', endpoint='blog/about_me'),
  Rule('/feeds', endpoint='blog/feeds'),
  Rule('/feeds/<feed_name>,rss', endpoint='blog/show_feed'),
])

def app(environ, start_response):
  urls = url_map.bind_to_environ(environ)
  try:
    endpoint, args = urls.match()
  except HTTPException, e:
    return e(environ, start_response)
  start_response('200 OK', [('Content-Type', 'text/plain')])
  return ['Rule points to %r with arguments %r ' % (endpoint, args)]

#Rule points to 'blog/show_post' with arguments {'month': 13, 'slug': u'www',
'day': 22, 'year': 2000} 

'''

'''
url_map = Map([
  Rule('/', endpoint='/lobby'),
  Rule('/<int:room>', endpoint='/room'),
  Rule('/login', endpoint='/loin'),
  Rule('/logout', endpoint='/logout'),
])
  

def app(environ, start_response):
  urls = url_map.bind_to_environ(environ)
  try:
    endpoint, args = urls.match()
  except HTTPException, e:
    return e(environ, start_response)
  start_response('200 OK', [('Content-Type', 'text/plain')])
  return ['Rule points to %r with arguments %r ' % (endpoint, args)]
'''

url_map = Map() #place folder?
def expose(rule, **kw):
  def decorate(f):
    kw['endpoint'] = f.__name__
    url_map.add(Rule(rule, **kw))
    return f
  return decorate


store = FilesystemSessionStore()

#def verifyCookie(cookie):


@expose('/')
def top(request):
  return  wz.Response('top', mimetype='text/plain')

@expose('/lobby')
def lobby(request):
  sid = request.cookies.get('session_id')
  if sid is None:
    return wz.redirect('/login', 301)
  return  wz.Response('lobby', mimetype='text/plain')
  
@expose('/login')
def login(request):
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
def logout(request):
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
def room(request, room):
  return  wz.Response('room %i'%(room, ), mimetype='text/plain')

views = {
  "top":top, 
  "lobby":lobby, 
  "login": login, 
  "logout": logout,
  "room": room
  }

def app(environ, start_response):
  request = wz.Request(environ)
  adapter = url_map.bind_to_environ(environ)
  try:
    endpoint, values = adapter.match()
    handler = views[endpoint]
    response = handler(request, **values)

  except HTTPException, e:
    return e(environ, start_response)
  return wz.ClosingIterator(response(environ, start_response))


w, c = make((9000, app), (None, None))
reactor.listenTCP(9000, w)
reactor.run()


