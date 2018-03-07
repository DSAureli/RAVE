import sqlite3
from flask import Flask

DB_PATH = "/var/www/data/rave/rave/rave.db"

app = Flask(__name__)
app.secret_key = 'super secret string'

import flask_login

login_manager = flask_login.LoginManager()

login_manager.init_app(app)

class User(flask_login.UserMixin):
    pass	

@login_manager.user_loader
def user_loader(email):
	con = sqlite3.connect(DB_PATH)
	con.row_factory = sqlite3.Row
	cur = con.execute( "SELECT * FROM users WHERE email=?", (email,) )
	r = cur.fetchone()
	if len(r)>0:
		user = User()
		user.id = email
		return user
	return None

import rave.api
import rave.login
import rave.sign
import rave.djenius
