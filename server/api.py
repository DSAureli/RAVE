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
		x = sign.signUp(request.form['email'], request.form['password'], request.form['username'])
		if x:
			return "0"
		else:
			return "-1"
	else:
		return "0"


	
@app.route('/login', methods=['POST', 'DELETE'])
def log():
	if request.method == 'POST':
		if ( login.Login(request.form['email'], request.form['password']) ):
			return "0"
		else:
			return "-1"
	else:	
		flask_login.logout_user()
		return "0"


	
@app.route('/djenius', methods=['GET', 'PUT', 'POST', 'DELETE'])
def djenius():
	#adding
	if request.method == 'POST':
		data = request.get_json()
		return create(data)
		
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
		return change(data)
			
		
	#deleting
	if request.method == 'DELETE':
		data = request.get_json()
		return delete(data)
			
		

@app.route('/version', methods=['GET'])
def version():
	return getVersion( request.args['page'] )
