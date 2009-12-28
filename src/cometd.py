#/usr/bin/python

import StringIO
import urllib
import cgi

from SocketServer import BaseServer, TCPServer

from wsgiref.simple_server import WSGIRequestHandler, WSGIServer
from wsgiref.handlers import SimpleHandler
from twisted.internet import reactor, protocol

import simplejson

__version__ = "0.1"


class CometServer(object):
  def __init__(self, server_name, pub, sub, RequestHandlerClass):
    print 'CometServer:__init__'
    self.RequestHandlerClass = RequestHandlerClass
    self.pendingHandlers = []

    self.server_name = server_name
    self.pub_app, self.pub_port= pub
    self.sub_app, self.sub_port= sub

    self.pub_environ = {}
    self.sub_environ = {}
    self.setup_environ(self.pub_environ, self.pub_port)
    self.setup_environ(self.sub_environ, self.sub_port)

  def setup_environ(self, env, port):
    # fomr WSGIServer
    # Set up base environment
    env['SERVER_NAME'] = self.server_name
    env['GATEWAY_INTERFACE'] = 'CGI/1.1'
    env['SERVER_PORT'] = str(port)
    env['REMOTE_HOST']=''
    env['CONTENT_LENGTH']=''
    env['SCRIPT_NAME'] = ''

  def server_bind(self):
    """Override server_bind to store the server name."""
    pass

  def storeHandler(self, handler, path):
    print 'CometServer:storeHandler', handler, path
    self.pendingHandlers.append(handler)

  def getHandlers(self, path):
    return self.pendingHandlers

  def handle_sub_request(self, request, client_address, protocol):
    h, path, message = self._handle_request(request, 
                                          self.sub_app,
                                          self.sub_environ, 
                                          client_address, protocol)
    assert message is None
    self.storeHandler(h, path)

  def handle_pub_request(self, request, client_address, protocol):
    h, path, message = self._handle_request(request, 
                                        self.pub_app,
                                        self.pub_environ,
                                        client_address, protocol)
    h.handle_response(path, message)
    self.broadcast(path, message)
  

  def _handle_request(self, request, app, env, client_address, protocol):
    print 'CometServer:_handle_request'
    h = self.RequestHandlerClass(request, client_address, self)
    h.rfile.seek(0)
    h.raw_requestline = h.rfile.readline()
    if not h.raw_requestline:
      self.close_connection = 1
      print 'closing connection'
      return
    if not h.parse_request():
      print 'parse error'
      return 
    path, message = h.handle_request(app, env, protocol)
    return h, path, message

  def broadcast(self, path, message):
    for h in self.getHandlers(path):
      print h
      h.handle_response(path, message)
    self.pendingHandlers = [] #ugh!


class SplittedHandler(SimpleHandler):
  def get_ready(self, app):
    try:
      print "SplittedHandler:get_ready"
      self.setup_environ()
      print "made setup_environ, calling app"
      a, b = app(self.environ, self.start_response)
      print a, b
      return a, b
    except:
      try:
        self.handle_error()
        return None, None
      except:
        # If we get an error handling an error, just give up already!
        self.close()
        raise   # ...and let the actual server figure it out.


class CometHandler(WSGIRequestHandler):

  server_version = "CometServer/" + __version__

  def __init__(self, request, client_address, server):
    self.rfile, self.wfile = request
    self.client_address = client_address
    self.server = server
    self.httphandler = None

  def get_environ(self, base_environ):
    env = base_environ.copy()
    env['SERVER_PROTOCOL'] = self.request_version
    env['REQUEST_METHOD'] = self.command
    if '?' in self.path:
      path,query = self.path.split('?',1)
    else:
      path,query = self.path,''

    env['PATH_INFO'] = urllib.unquote(path)
    env['QUERY_STRING'] = query

    host = self.address_string()
    if host != self.client_address[0]:
      env['REMOTE_HOST'] = host
    env['REMOTE_ADDR'] = self.client_address[0]

    if self.headers.typeheader is None:
      env['CONTENT_TYPE'] = self.headers.type
    else:
      env['CONTENT_TYPE'] = self.headers.typeheader

    length = self.headers.getheader('content-length')
    if length:
      env['CONTENT_LENGTH'] = length

    for h in self.headers.headers:
      k,v = h.split(':',1)
      k=k.replace('-','_').upper(); v=v.strip()
      if k in env:
        continue                    # skip content length, type,etc.
      if 'HTTP_'+k in env:
        env['HTTP_'+k] += ','+v     # comma-separate multiple headers
      else:
        env['HTTP_'+k] = v
    return env

  def close(self):
    pass

  def setup(self):
    raise

  def finish(self):
    raise


  def handle(self):
    raise
    WSGIRequestHandler.handle(self)
  
  def handle_request(self, app, env, protocol):
    self.protocol = protocol
    print 'CometHandler:handle_request'
    server = self.server
    self.rfile.seek(0) 
    print self.rfile.getvalue()
    print 'evoking app'
    h = SplittedHandler(
            self.rfile, self.wfile, self.get_stderr(), 
            self.get_environ(env)
            )
    h.request_handler = self
    self.app_request, self.app_response = h.get_ready(app)
    self.httphandler = h
    print self.app_request, self.app_response, self.httphandler
    return self.app_request()


  def handle_response(self, path, message):
    print 'CometHandler:handle_response'
    self.httphandler.result = self.app_response(path, message)
    self.httphandler.finish_response()
    r = self.wfile.getvalue()
    print r
    self.protocol.sendData()


def make(publish, subscribe):
  server = CometServer('localhost', 
                    (publish, 3124, ),#CometHandler)
                    (subscribe, 3165, ), #CometHandler),
                    CometHandler)


  class Publication(protocol.Protocol):
    def connectionLost(self, reason):
      pass
  
    def connectionMade(self):
      print 'Publication::connectionMade'
      self.rfile = StringIO.StringIO()#'rb', self.rbufsize)
      self.wfile = StringIO.StringIO()#'wb', self.wbufsize)
  
    def dataReceived(self, data):
      self.rfile.write(data) #ugh!
      peer = self.transport.getPeer()
      server.handle_pub_request((self.rfile, self.wfile), peer, self)

    def sendData(self): 
      self.transport.write(self.wfile.getvalue())
    
  class Publisher(protocol.ServerFactory):
    def buildProtocol(self, addr):
      return Publication()

  class Subscription(protocol.Protocol):
    def connectionLost(self, reason):
      pass
  
    def connectionMade(self):
      self.rfile = StringIO.StringIO()#'rb', self.rbufsize)
      self.wfile = StringIO.StringIO()#'wb', self.wbufsize)
  
    def dataReceived(self, data):
      self.rfile.write(data) 
      peer = self.transport.getPeer()
      server.handle_sub_request((self.rfile, self.wfile), peer, self)
  
    def sendData(self): 
      self.transport.write(self.wfile.getvalue())
  
  class Subscriver(protocol.ServerFactory):
    def buildProtocol(self, addr):
      return Subscription()
  
  return Publisher(), Subscriver()

def publish(environ, start_response):
  def parseCookies(s):
    cookies = {}
    for x in [t.strip() for t in s.replace(",", ":").split(":")]:
      if x == "":
        continue
      key,value = x.split("=", 1)
      cookies[key] = value
    return cookies
  print 'publish'
  stdout = StringIO.StringIO()
  q = cgi.parse_qs(environ['QUERY_STRING'])
  cookies = parseCookies(environ.get("HTTP_COOKIE", ""))

  def request():
    print 'publish(request)'
    message = q['message'][0]
    print message
    return '', message

  def response(path, message):
    print 'publish(response)'
    value = {'status': True}
    j = '%s(%s);'%(q['callback'][0], simplejson.dumps(value))
    print >> stdout, j
    start_response("200 OK", [('Content-Type','text/javascript')])
    return [stdout.getvalue()]
  return request, response


def subscribe(environ, start_response):
  print 'subscribe'
  stdout = StringIO.StringIO()
  q = cgi.parse_qs(environ['QUERY_STRING'])

  def request():
    print 'subscribe(request)'
    return '', None
  
  def response(path, message):
    print 'subscribe(response)'
    value = {'message':message, 'who':'hogeo'}
    j = '%s(%s);'%(q['callback'][0], simplejson.dumps(value))
    print >> stdout, j
    start_response("200 OK", [('Content-Type','text/javascript')])
    return [stdout.getvalue()]
  return request, response

pub, sub = make(publish, subscribe)


reactor.listenTCP(3165, sub)
reactor.listenTCP(3124, pub)
reactor.run()

