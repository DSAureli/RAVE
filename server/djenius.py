from rave import app
from rave import login_manager
from rave import User
from rave import DB_PATH
import flask_login
import sqlite3
import json

#call to create record
def create(info):
	user = flask_login.current_user.get_id()#"giorgio"
	annID = info['data']['id']
	page = info['page']
	version = info['version']
	public = info['data']['properties']['public']
	annotation = info['data']['properties']['annotation']
	array = json.dumps(info['data']['ranges'])

	#try:
	con = sqlite3.connect(DB_PATH)
	cur = con.cursor()

	#try:
	cur.execute( "INSERT INTO annotations (id,user, page, version, public, annotation, array) VALUES (?,?,?,?,?,?,?)", (annID, user, page, version, public, annotation, array) )
		#con.commit()
	#except:
		#con.rollback()
		#con.close()
		#return False

	cur = con.execute( "SELECT * FROM versions WHERE page=?", (page,) )
	r = cur.fetchone()
	if r is None:
		cur = con.execute( "INSERT INTO versions (page, version) VALUES (?,?)", (page,version) )
		con.commit()
	con.close()
	#	return True
	#except:
	#	return False
	return True
	
	
	
#call to update record	
def change(info):
	annID = info['data']['id']
	public = info['data']['properties']['public']
	annotation = info['data']['properties']['annotation']
	array = json.dumps(info['data']['ranges'])
	
	#try:
	con = sqlite3.connect(DB_PATH)
	cur = con.cursor()
		
		#try:
	cur.execute( "UPDATE annotations SET public=?, annotation=?, array=? WHERE id=?", (public, annotation, array, annID) )
	con.commit()
		#except:
		#	con.rollback()
		#	con.close()
		#	return False
		
	con.close()
	return True
	#except:
	return False
	


	
	
	
	
	
	
	
	
	
	
	
	
	
	