#!/usr/bin/python3

import os

site_path = "/home/web/davide.nanni11"
data_path = os.path.join(site_path, "data")
venv_path = os.path.join(data_path, "venv")
wsgi_path = os.path.join(site_path, "scripts/wsgi/wsgi.wsgi")

activate_env = os.path.join(venv_path, "bin/activate_this.py")
exec(open(activate_env).read(), dict(__file__=activate_env))

from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class MyHandler(FileSystemEventHandler):
	def on_modified(self, event):
		Path(wsgi_path).touch()

event_handler = MyHandler()
observer = Observer()
observer.schedule(event_handler, data_path, recursive = True)
observer.start()

input()
observer.stop()