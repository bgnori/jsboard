#!/usr/bin/python

import StringIO
import urllib

from wsgiref.simple_server import WSGIRequestHandler, WSGIServer
from wsgiref.handlers import SimpleHandler
from twisted.internet import protocol

import simplejson

__version__ = "0.1"


class Session(object):
  def __init__(self, i):
    self.session_id = i
    self.handlers = []
    self.channels = {}

  def bind(self, h):
    self.handlers.append(h)

  def subscribe(self, channel):
    self.channels.update({channel: 0}) #ugh! set

  def fire(self, channel, message):
    # ugh! O(n) algorithm for publishing for n clients
    # we should register sessions to the channel
    # see DualServer:fire also
    if channel in self.channels: 
      for h in self.handlers:
        h.handle_response(message)

class DualServer(object):
  def __init__(self, server_name, web, comet):
    print 'DualServer:__init__'
    self.sessions = {}

    self.server_name = server_name
    self.web_port, self.web_app, self.webHandlerClass = web
    self.comet_port, self.comet_app, self.cometHandlerClass = comet

    self.web_environ = {}
    self.comet_environ = {}
    self.setup_environ(self.web_environ, self.web_port)
    self.setup_environ(self.comet_environ, self.comet_port)

  def setup_environ(self, env, port):
    # fomr WSGIServer
    # Set up base environment
    env['SERVER_NAME'] = self.server_name
    env['GATEWAY_INTERFACE'] = 'CGI/1.1'
    env['SERVER_PORT'] = str(port)
    env['REMOTE_HOST']=''
    env['CONTENT_LENGTH']=''
    env['SCRIPT_NAME'] = ''
    env['DualServer'] = self

  def handle_comet(self, request, client_address, protocol):
    print 'DualServer:handle_comet'

    h = self.cometHandlerClass(request, client_address, self)
    h.rfile.seek(0)
    h.raw_requestline = h.rfile.readline()
    if not h.raw_requestline:
      self.close_connection = 1
      print 'closing connection'
      return
    if not h.parse_request():
      print 'parse error'
    session_id = h.handle_request(self.comet_app, self.comet_environ, protocol)
    # not path, must be session.
    s = self.find(session_id)
    if not s:
      s = Session(session_id)
    s.bind(h)

  def find(self, session_id):
    return self.sessions.get(session_id, None)


  def handle_web(self, request, client_address, protocol):
    print 'DualServer:handle_web'
    h = self.webHandlerClass(request, client_address, self)
    h.rfile.seek(0)
    h.raw_requestline = h.rfile.readline()
    if not h.raw_requestline:
      self.close_connection = 1
      print 'closing connection'
      return
    print 'DualServer:handle_web, h.raw_requestline:', h.raw_requestline
    if not h.parse_request():
      print 'parse error'
    h.handle_request(self.web_app, self.web_environ, protocol)


  def comet(self, channel, message):
    print 'DualServer:comet'
    for s in self.sessions.values(): 
      s.fire(channel, message)


class SplittedHandler(SimpleHandler):
  def get_ready(self, app):
    try:
      self.setup_environ()
      print "SplittedHandler:get_ready", self.environ
      print "SplittedHandler:get_ready", repr(self.stdin.getvalue())
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


class BaseHandler(WSGIRequestHandler):

  server_version = "DualServer/" + __version__

  def __init__(self, request, client_address, server):
    self.rfile, self.wfile = request
    self.client_address = client_address
    self.server = server

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

class WebHandler(BaseHandler):
  def handle_request(self, app, env, protocol):
    print 'WebHandler:handle_request'
    self.protocol = protocol
    server = self.server

    print 'WebHandler:handle_request ... making SimpleHandler'
    handler = SimpleHandler(
            self.rfile, self.wfile, self.get_stderr(), 
            self.get_environ(env)
            )
    handler.request_handler = self      # backpointer for logging
    handler.run(app)


class CometHandler(BaseHandler):

  def __init__(self, request, client_address, server):
    BaseHandler.__init__(self, request, client_address, server)
    self.httphandler = None


  def handle(self):
    raise
  
  def handle_request(self, app, env, protocol):
    self.protocol = protocol
    print 'CometHandler:handle_request'
    server = self.server
    #print self.rfile.getvalue()
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
    self.protocol.sendData(r)


def make(web, comet):
  server = DualServer('localhost', 
                    (web[0], web[1], WebHandler),
                    (comet[0], comet[1], CometHandler))

  class HTTPChannel(protocol.Protocol):
    def connectionLost(self, reason):
      pass
    def connectionMade(self):
      self.rfile = StringIO.StringIO()#'rb', self.rbufsize)
      self.wfile = StringIO.StringIO()#'wb', self.wbufsize)

    def sendData(self): 
      self.transport.write(self.wfile.getvalue())

    def dataReceived(self, data):
      self.rfile.write(data)
      if self.isRequestReady():
        self.onRequestReady()

    def isRequestReady(self):
      v = self.rfile.getvalue()
      if '\r\n\r\n' in v:
        print 'isRequestReady', repr(v)
        return True #ugh!
      return False

    def onRequestReady(self):
      raise

  class Web(HTTPChannel):
    def onRequestReady(self):
      peer = self.transport.getPeer()
      server.handle_web((self.rfile, self.wfile), peer, self)
    
  class WebFactory(protocol.ServerFactory):
    def buildProtocol(self, addr):
      return Web()

  class Comet(HTTPChannel):
    def onRequestReady(self):
      peer = self.transport.getPeer()
      server.handle_comet((self.rfile, self.wfile), peer, self)
  
  class CometFactory(protocol.ServerFactory):
    def buildProtocol(self, addr):
      return Comet()
  
  return WebFactory(), CometFactory()


