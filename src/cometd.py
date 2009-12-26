#/usr/bin/python

import StringIO

from SocketServer import BaseServer, TCPServer

from wsgiref.simple_server import WSGIRequestHandler, WSGIServer
from wsgiref.handlers import SimpleHandler
from twisted.internet import protocol

__version__ = "0.1"


class CometServer(WSGIServer):
  application = None

  def __init__(self, server_address, RequestHandlerClass):
    print 'CometServer:__init__'
    BaseServer.__init__(self, server_address, RequestHandlerClass)
    #self.socket = socket.socket(self.address_family,
    #                            self.socket_type)
    self.server_bind()
    #self.server_activate()
    self.pendingHandlers = []

  def set_app(self, app):
    self.app = app

  def get_app(self):
    return self.app

  def server_bind(self):
    """Override server_bind to store the server name."""
    print 'CometServer::server_bind'
    #TCPServer.server_bind(self)
    #HTTPServer.server_bind(self)
    self.server_name = 'localhost' # fake
    self.server_port = '9999' # fake
    self.setup_environ()
    self.base_environ['server'] = self

  def storeHandler(self, handler, path):
    print 'CometServer:storeHandler', handler, path
    self.pendingHandlers.append(handler)

  def getHandlers(self, path):
    return self.pendingHandlers

  def handle_request(self, request, client_address, protocol):
    print 'CometServer:handle_request'
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
    path, message = h.handle_request(protocol)
    print path, message
    self.post_process_request(h, path, message)

  def post_process_request(self, h, path, message):
    raise

  def finish_request(self, request, client_address):
      """Finish one request by instantiating RequestHandlerClass."""
      raise
      #self.RequestHandlerClass(request, client_address, self)

  def handle_response(self, path, message):
    '''Ugh!'''
    for h in self.getHandlers(path):
      print h
      h.handle_response(path, message)
    self.pendingHandlers = [] #ugh!


class PublishServer(CometServer):
  def set_subscriber(self, subscriber):
    self.subscriber = subscriber

  def post_process_request(self, h, path, message):
    h.handle_response(path, message)
    self.subscriber.handle_response(path, message)

class SubscribeServer(CometServer):
  def post_process_request(self, h, path, message):
    assert message is None
    self.storeHandler(h, path)



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

  def close(self):
    pass

  def setup(self):
    raise

  def finish(self):
    raise


  def handle(self):
    raise
    WSGIRequestHandler.handle(self)
  
  def handle_request(self, protocol):
    self.protocol = protocol
    print 'CometHandler:handle_request'
    server = self.server
    app = server.get_app()
    self.rfile.seek(0) 
    print self.rfile.getvalue()
    print 'evoking app'
    h = SplittedHandler(
            self.rfile, self.wfile, self.get_stderr(), self.get_environ()
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
  sub = SubscribeServer(('localhost', 3165), CometHandler) #ugh!
  sub.set_app(subscribe)

  pub = PublishServer(('localhost', 3124), CometHandler) #ugh!
  pub.set_subscriber(sub)
  pub.set_app(publish)

  class Subscription(protocol.Protocol):
    def connectionLost(self, reason):
      pass
  
    def connectionMade(self):
      self.rfile = StringIO.StringIO()#'rb', self.rbufsize)
      self.wfile = StringIO.StringIO()#'wb', self.wbufsize)
  
    def dataReceived(self, data):
      self.rfile.write(data) 
      peer = self.transport.getPeer()
      sub.handle_request((self.rfile, self.wfile), peer, self)
  
    def sendData(self): 
      self.transport.write(self.wfile.getvalue())
  
  class Subscriver(protocol.ServerFactory):
    def buildProtocol(self, addr):
      return Subscription()
  
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
      pub.handle_request((self.rfile, self.wfile), peer, self)

    def sendData(self): 
      self.transport.write(self.wfile.getvalue())
    
  class Publisher(protocol.ServerFactory):
    def buildProtocol(self, addr):
      return Publication()

  return Publisher(), Subscriver()

