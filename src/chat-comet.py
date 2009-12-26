#/usr/bin/python

import StringIO
import cgi

from twisted.internet import reactor, protocol
from cometd import make

import simplejson



def publish(environ, start_response):
  print 'publish'
  stdout = StringIO.StringIO()
  q = cgi.parse_qs(environ['QUERY_STRING'])

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

