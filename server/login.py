from rave import app
from rave import login_manager
from rave import User
from rave import DB_PATH
import flask_login
import sqlite3

def Login(email, password):
	#try:
	con = sqlite3.connect(DB_PATH)
	con.row_factory = sqlite3.Row
	cur = con.execute( "SELECT * FROM users WHERE email=? AND password=?", (email,password))
	r = cur.fetchone()
	if len(r)>0:
		user = User()
		user.id = email
		flask_login.login_user(user)
	return True
	#except:
		#return False
	
#def Logout(email, password):
#	if session['logged_in'] == True:
#		session['logged_in'] = False
#		return True
#	else:
#		return False
