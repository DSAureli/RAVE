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
	else:
		return "login form"


	
@app.route('/login', methods=['POST', 'DELETE'])
def log():
	if request.method == 'POST':
		if ( login.Login(request.form['email'], request.form['password']) ):
			return "login done"
		else:
			return "error"
	else:	
		flask_login.logout_user()
		return "logged out"


	
@app.route('/djenius', methods=['GET', 'PUT', 'POST', 'DELETE'])
def djenius():
	#adding
	if request.method == 'POST':
		data = request.get_json()
		if create(data):
			return "0"
		else:
			return "-1"
		
	#returning
	if request.method == 'GET':
		res = get( request.args['page'] )
		if res=="-1":
			return "-1"
		else:
			return res

	#changing
	if request.method == 'PUT':
		data = request.get_json()
		if change(data):
			return "0"
		else:
			return "-1"
		
	#deleting
	if request.method == 'DELETE':
		data = request.get_json()
		if delete(data):
			return "0"
		else:
			return "-1"
		

@app.route('/version', methods=['GET'])
def version():
	return getVersion( request.args['page'] )
