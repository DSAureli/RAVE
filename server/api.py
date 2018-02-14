from flask import request
from rave import app
from rave import login_manager
from rave import User
import flask_login
import sign
import login
from djenius import create
from djenius import change
from djenius import delete
from djenius import getVersion
from djenius import get


@app.route('/sign', methods=['POST', 'DELETE'])
def Sign():
	if request.method == 'POST':
		email = request.form['email']
		x = sign.signUp(email, request.form['password'], request.form['name'])
		if x:
			return "signed"
		else:
			return "error"
	else:	#if method is DELETE
		return "login form"


	
@app.route('/login', methods=['POST', 'DELETE'])
def log():
	if request.method == 'POST':
		if ( login.Login(request.form['email'], request.form['password']) ):
			return "login done"
		else:
			return "error"
	else:	#if method is DELETE
		flask_login.logout_user()
		return "logged out"


	
@app.route('/djenius', methods=['GET', 'PUT', 'POST', 'DELETE'])
#@login_required
def djenius():
	#data = request.get_json()
	
	#adding
	if request.method == 'POST':
		data = request.get_json()
		if create(data):
			return "Annotation added"
		else:
			return "Error"
		
	#returning
	if request.method == 'GET':
		return get( request.args['page'] )

	#changing
	if request.method == 'PUT':
		data = request.get_json()
		if change(data):
			return "Annotation changed"
		else:
			return "Update error"
		
	#deleting
	if request.method == 'DELETE':
		data = request.get_json()
		if delete(data):
			return "Annotation deleted"
		else:
			return "Delete error"
		

@app.route('/version', methods=['POST'])
def version():
	data = request.get_json()
	return getVersion(data)
