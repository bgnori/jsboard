#!/usr/bin/python

from wsgiref.simple_server import make_server, demo_app
import cgi
import sys
import simplejson

def my_app(environ, start_response):
    from StringIO import StringIO
    stdout = StringIO()
    d = cgi.parse_qs(environ['QUERY_STRING'])
    value = {"status": True, "gnubgid": "jHPDAQXgPHgBWA:UQkyAQAAAAAA"}
    j = '%s(%s);'%(d['callback'][0], simplejson.dumps(value))
    print >>stdout, j
    print >>sys.stderr, 'got:', d['gnubgid'][0], d['move'][0]
    print >>sys.stderr, 'sending:' ,j
    start_response("200 OK", [('Content-Type','text/javascript')])
    return [stdout.getvalue()]

httpd = make_server('', 8000, my_app);

httpd.serve_forever();


