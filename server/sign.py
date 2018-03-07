import sqlite3
from rave import app
from rave import login_manager
from rave import User
from rave import DB_PATH
import flask_login

def signUp(email, password, name):
	try:
		con = sqlite3.connect(DB_PATH)
		#except Exception as e:
			#return e.message
		cur = con.cursor()
		
		try:
			cur.execute( "INSERT INTO users (email, password,name) VALUES (?,?,?)", (email,password,name) )
			con.commit()
		except:
			con.rollback()
			con.close()
			return False
		
		con.close()
		user = User()
		user.id = email
		flask_login.login_user(user)
		return True
	except:
		return False
	
		
	
#def delete(email):
	
