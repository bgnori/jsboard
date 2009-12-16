#!/usr/bin/env python
# -*- coding: us-ascii -*-
# vim: syntax=python
#
# Copyright 2006-2008 Noriyuki Hosaka nori@backgammon.gr.jp
#

from distutils.core import setup
#from setuptools import setup
import os.path


NAME = 'jsboard'
AUTHOR = "Noriyuki Hosaka", "bgnori@gmail.com"
VERSION = open("VERSION").read().strip()
DESCRIPTION = "backgammon bloging parts support"
LONG_DESCRIPTION=open("DESCRIPTION").read()
HOMEPAGE="http://www.backgammonbase.com"

try:
    # add classifiers and download_url syntax to distutils
    from distutils.dist import DistributionMetadata
    DistributionMetadata.classifiers = None
    DistributionMetadata.download_url = None
except:
    pass

setup(
  name=NAME,
  version=VERSION,
  zip_safe=False,
  description=DESCRIPTION,
  long_description=LONG_DESCRIPTION,
  author=AUTHOR[0],
  author_email=AUTHOR[1],
  scripts=['scripts/start-jsboard-move',],
  package_dir = {
                 'jsboard':'src', #root
                 },
  packages = ['jsboard', 
              ],
  data_files=[('/var/www/backgammonbase.com/assets/', 
                  ['src/jsboard.js',
                   'assets/default.css']),
              ('/var/www/backgammonbase.com/doc/', 
                  ['howtouse.txt',
                   'apispec.txt',
                  ]),
              ],
  install_requires=[
      #FIXME! packages installed via RPM do not have egg.
      #"image-server >= 1.1.7", 
      #"python-bglib-library>= 0.0.9",
      #"python-tonic-library>= 0.0.16",
      #"python-simplejson>= 2.0.5",
  ],
  requires=[
    'image-server >= 1.1.7', 
    'python-bglib-library>= 0.0.9',
    'python-tonic-library>= 0.0.16',
    'python-simplejson>= 2.0.5',
  ],
  provides=['jsboard'],
  url=HOMEPAGE,
  license="proprietary",
)



