from rave import app
from rave import login_manager
from rave import User
from rave import DB_PATH
import flask_login
import sqlite3

def Login(email, password):
	try:
		con = sqlite3.connect(DB_PATH)
		con.row_factory = sqlite3.Row
		cur = con.execute( "SELECT * FROM users WHERE email=? AND password=?", (email,password))
		r = cur.fetchone()
		if r is not None:
			user = User()
			user.id = email
			flask_login.login_user(user)
			return True
		else:
			return False
	except:
		return False

