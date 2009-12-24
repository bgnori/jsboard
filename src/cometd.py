#/usr/bin/python

import StringIO

from twisted.internet import reactor, protocol

from SocketServer import BaseServer, TCPServer
from wsgiref.simple_server import WSGIRequestHandler, WSGIServer, demo_app
import cgi

import simplejson

clients = []

class WSGIAdaptor(WSGIServer):
  application = None

  def __init__(self, server_address, RequestHandlerClass):
    print 'WSGIAdaptor:__init__'
    BaseServer.__init__(self, server_address, RequestHandlerClass)
    #self.socket = socket.socket(self.address_family,
    #                            self.socket_type)
    self.server_bind()
    #self.server_activate()

  def server_bind(self):
    """Override server_bind to store the server name."""
    print 'WSGIAdaptor::server_bind'
    #TCPServer.server_bind(self)
    #HTTPServer.server_bind(self)
    self.server_name = 'localhost' # fake
    self.server_port = '9999' # fake
    self.setup_environ()
    self.base_environ['server'] = self

  def get_message(self):
    return self.message

  def set_message(self, message):
    self.message = message


class WSGISupportHandler(WSGIRequestHandler):
  def setup(self):
    self.rfile, self.wfile = self.request

  def finish(self):
    pass

  def handle(self):
    self.rfile.seek(0) #UGH! UGH! UGH!
    WSGIRequestHandler.handle(self)

  def parse_request(self):
    print 'raw_requestline', self.raw_requestline
    ok = WSGIRequestHandler.parse_request(self)
    print "WSGIRequestHandler:parse_request", ok
    if not ok:
      print 'rfile'
      print self.rfile.getvalue()
      print 'wfile'
      print self.wfile.getvalue()

    return ok


def subscribe(environ, start_response):
  stdout = StringIO.StringIO()
  q = cgi.parse_qs(environ['QUERY_STRING'])
  msg = environ['server'].get_message()
  value = {'message':msg, 'who':'hogeo'}
  j = '%s(%s);'%(q['callback'][0], simplejson.dumps(value))
  print >> stdout, j
  start_response("200 OK", [('Content-Type','text/javascript')])
  return [stdout.getvalue()]



class Subscription(protocol.Protocol):
  def connectionLost(self, reason):
    pass

  def connectionMade(self):
    print 'Subscription::connectionMade'
    self.rfile = StringIO.StringIO()#'rb', self.rbufsize)
    self.wfile = StringIO.StringIO()#'wb', self.wbufsize)
    self.adaptor = WSGIAdaptor(('localhost', 3165), WSGISupportHandler) #ugh!
    self.adaptor.set_app(subscribe)
    clients.append(self)

  def dataReceived(self, data):
    self.rfile.write(data) 

  def sendMessge(self, msg): 
    adaptor = self.adaptor
    adaptor.set_message(msg)
    peer = self.transport.getPeer()
    adaptor.finish_request((self.rfile, self.wfile), peer)
    print '=== Subscriver (request) ===='
    print self.rfile.getvalue() 
    print 
    print '=== Subscriver (response) ===='
    print self.wfile.getvalue() 
    print 
    self.transport.write(self.wfile.getvalue())

class Subscriver(protocol.ServerFactory):
  def buildProtocol(self, addr):
    return Subscription()



def publish(environ, start_response):
  stdout = StringIO.StringIO()
  print 'publish'
  q = cgi.parse_qs(environ['QUERY_STRING'])
  msg = q['message'][0]
  print msg
  environ['server'].set_message(msg)
  value = {'status': True}
  j = '%s(%s);'%(q['callback'][0], simplejson.dumps(value))
  print >> stdout, j
  start_response("200 OK", [('Content-Type','text/javascript')])
  return [stdout.getvalue()]



class Publication(protocol.Protocol):
  def connectionMade(self):
    print 'Publication::connectionMade'
    self.rfile = StringIO.StringIO()#'rb', self.rbufsize)
    self.wfile = StringIO.StringIO()#'wb', self.wbufsize)
    self.adaptor = WSGIAdaptor(('localhost', 3124), WSGISupportHandler) #ugh!
    self.adaptor.set_app(publish)

  def connectionLost(self, reason):
    pass

  def dataReceived(self, data):
    self.rfile.write(data) #ugh!
    print '=== Publisher ===='
    print data
    print 
    peer = self.transport.getPeer()
    self.adaptor.finish_request((self.rfile, self.wfile), peer)
    msg = self.adaptor.get_message()
    for c in clients:
      c.sendMessge(msg)
    self.transport.write(self.wfile.getvalue())


class Publisher(protocol.ServerFactory):
  def buildProtocol(self, addr):
    return Publication()


reactor.listenTCP(3165, Subscriver())
reactor.listenTCP(3124, Publisher())
reactor.run()

