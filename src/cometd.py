#/usr/bin/python

# from
# http://omake.accense.com/wiki/Twisted%E3%81%AE%E7%9F%AD%E3%81%84%E3%82%BD%E3%83%BC%E3%82%B9%E3%82%B3%E3%83%BC%E3%83%89%E9%9B%86


from twisted.internet import reactor, protocol


clients = []

class Subscription(protocol.Protocol):
  def connectionLost(self, reason):
    pass

  def connectionMade(self):
    clients.append(self)

  def dataReceived(self, data):
    pass

  def sendMessge(self, msg):
    self.transport.write(msg)

class Subscriver(protocol.ServerFactory):
  def buildProtocol(self, addr):
    return Subscription()


class Publication(protocol.Protocol):
  def connectionLost(self, reason):
    pass

  def connectionMade(self):
    pass

  def dataReceived(self, data):
    for c in clients:
      c.sendMessge(data)

  def sendMessge(self, msg):
    pass

class Publisher(protocol.ServerFactory):
  def buildProtocol(self, addr):
    return Publication()


reactor.listenTCP(3165, Subscriver())
reactor.listenTCP(3124, Publisher())
reactor.run()

