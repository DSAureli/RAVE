import os
import sys
import site

data_path = "/home/web/site1767/data"
venv_path = os.path.join(data_path, "venv")
proj_path = os.path.join(data_path, "rave")
activate_env = os.path.join(venv_path, "bin/activate_this.py")

#sys.path = []
#sys.path.insert(0, proj_path)
#sys.path.insert(0, os.path.join(venv_path, "lib/python3.4/site-packages"))
#site.addsitedir(os.path.join(venv_path, "lib/python3.4/site-packages"))
#sys.path.append(proj_path)
exec(open(activate_env).read(), dict(__file__=activate_env))
#sys.path = []
sys.path.insert(0, proj_path)
sys.path.insert(0, os.path.join(venv_path, "lib/python3.4/site-packages"))
sys.path.insert(0, os.path.join(venv_path, "bin"))

from rave import app as application
application.debug = True
