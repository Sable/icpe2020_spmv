#!/usr/bin/python

import subprocess
import sys, getopt
import os


def main(argv):
  limit = 5000000
  browser = 0
  precision = 0
  b_found = False
  p_found = False
  output_file = 'e.out'
  try :
    opts, args = getopt.getopt(argv, "hb:p:o:")
  except getopt.GetoptError:
    print 'ERROR : run.py -b <browser> -p <precision> <input_filename>'
    sys.exit(2)
  for opt, arg in opts:
    if opt == '-h':
      print 'ERROR : run.py -b <browser> -p <precision> <input_filename>'
      sys.exit()
    elif opt == '-b':
      b_found = True
      if arg == 'chrome':
        browser = 0
      elif arg == 'firefox':
        browser = 1
      else:
        print 'Error in browser argument. Usage : run.py -b <browser> -p <precision> <input_filename>'
        sys.exit()
    elif opt == '-p':
      p_found = True
      if arg == 'single':
        precision = 0
      elif arg == 'double':
        precision = 1
      else:
        print 'Error in precision argument. Usage : run.py -b <browser> -p <precision> <input_filename>'
        sys.exit()
    elif opt == '-o':
      output_file = arg
  if not b_found or not p_found :
    print 'run.py -b <browser> -p <precision> <input_filename>'
    sys.exit()
  arg = args[0] 
  ls = subprocess.Popen(["wc", "-l", arg], stdout=subprocess.PIPE)
  size = int(ls.communicate()[0].split()[0])
  basename = os.path.basename(arg)
  loc = os.path.join(os.getcwd(),os.path.splitext(basename)[0])
  split = subprocess.Popen(["split", "-l", str(limit), "-d", '--additional-suffix=.mtx', arg, loc], stdout=subprocess.PIPE)
  split.communicate()
  if size > limit:
    num = size/limit
  else:
    num = 0
  if size % limit:
    num = num + 1;
  line1 = "var num = " + str(num) 
  line2 = "var filename = '" + os.path.splitext(basename)[0] + "'"  
  line3 = "var len = 0"
  line4 = "var browser = " + str(browser)
  line5 = "var output_file = '" + output_file + "'"
  line6 = "let TOTAL_MEMORY = 2147418112"
  if browser == 1:
    line6 = "let TOTAL_MEMORY = 16777216" 
  with open('my.js', 'w') as g:
    g.write(line1 + '\n' + line2 + '\n' + line3 + '\n' + line4 + '\n' + line5 + '\n' + line6 + '\n')
  httpd = subprocess.Popen(["python", "web.py"], stdout=subprocess.PIPE)
  url = "http://localhost:8080/static/index32.html"
  if precision == 1:
    url = "http://localhost:8080/static/index64.html"
  browser_path = r'../../../tools/chrome74/opt/google/chrome/chrome'
  browser_opts = ' '
  browser_opts = ' '.join(["--js-flags=\"--experimental-wasm-simd --wasm-no-bounds-checks --wasm-no-stack-checks\"", "--headless --disable-gpu --no-sandbox --remote-debugging-address=0.0.0.0 --remote-debugging-port=9222"])
  invocation = browser_path + " " + browser_opts + " " + url 
  print invocation
  p = subprocess.Popen(invocation, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True)
  out, err = p.communicate()
  httpd.terminate()
  files = os.path.splitext(basename)[0]
  for i in range(num):
    rm = subprocess.Popen(["rm", "-r", files+ str(i/10) + str(i%10) +'.mtx'], stdout=subprocess.PIPE)

if __name__ == "__main__":
  main(sys.argv[1:])
