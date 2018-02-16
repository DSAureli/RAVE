from rave import app
from rave import login_manager
from rave import User
from rave import DB_PATH
import flask_login
import sqlite3
import json


# TODO: change return values in api.py

#call to create record
def create(info):
	user = flask_login.current_user.get_id()#"giorgio"
	annID = info['data']['id']
	page = info['page']
	section= info['section']
	version = info['version']
	public = info['data']['properties']['public']
	annotation = info['data']['properties']['annotation']
	array = json.dumps(info['data']['ranges'])

	try:
		con = sqlite3.connect(DB_PATH)
		cur = con.cursor()

		cur.execute( "INSERT INTO annotations (id, user, page, section, version, public, annotation, array) VALUES (?,?,?,?,?,?,?,?)", (annID, user, page, section, version, public, annotation, array) )

		cur = con.execute( "SELECT * FROM versions WHERE page=?", (page,) )
		r = cur.fetchone()
		if r is None:
			cur = con.execute( "INSERT INTO versions (page, version) VALUES (?,?)", (page,version) )
		con.commit()
		con.close()
		return True
	except:
		con.rollback()
		con.close()
		return False
	
	
	
#call to update record	
def change(info):
	annID = info['data']['id']
	public = info['data']['properties']['public']
	annotation = info['data']['properties']['annotation']
	array = json.dumps(info['data']['ranges'])
	
	try:
		con = sqlite3.connect(DB_PATH)
		cur = con.cursor()	
		cur.execute( "UPDATE annotations SET public=?, annotation=?, array=? WHERE id=?", (public, annotation, array, annID) )
		con.commit()
		con.close()
		return True
	except:
		con.rollback()
		con.close()
		return False


#call to delete record
def delete(info):
	annID = info['data']['id']
	try:
		con = sqlite3.connect(DB_PATH)
		cur = con.cursor()
		cur.execute( "DELETE FROM annotations WHERE id=?", (annID,) )
		con.commit()
		con.close()
		return True
	except:
		con.rollback()
		con.close()
		return False
	
	
#call to get record
def get(info):
	page = info
	try:
		connection = sqlite3.connect(DB_PATH)
		connection.row_factory = sqlite3.Row
		cursor = connection.cursor()
		cursor = connection.execute( "SELECT * FROM annotations WHERE page=?", (page,))	
		res = cursor.fetchall()
		lista = list()
		for row in res:
			lista.append( {"page": row['page'], "section": row['section'], "version": row['version'], 
							"data":{ "id":row['id'], "ranges": json.loads(row['array'])}, 
							"properties":{ "annotation":row['annotation'], "public":row['public'] } 
						   }) 
		
		connection.close()
		return json.dumps(lista)
	except:
		connection.close()
		return "-1"
	

#call to get only the version 
def getVersion(info):
	page = info
	try:
		con = sqlite3.connect(DB_PATH)
		con.row_factory = sqlite3.Row
		cur = con.execute( "SELECT version FROM versions WHERE page=?", (page,))
		res = cur.fetchone()
		con.close()
		if res is None:
			return "0"
		else:
			return str(res['version'])
	except:
		con.close()
		return "-1"
	
	
	
	
	
	
	
	
	
	