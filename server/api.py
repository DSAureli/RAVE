from flask import request
from rave import app
from rave import login_manager
from rave import User
import flask_login
import sys
import sign
import login
#import djenius
from djenius import create
from djenius import change


@app.route('/sign', methods=['POST', 'DELETE'])
def Sign():
	#return str(sys.path).replace(",", ",<br>")
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
	data = request.get_json()
	if request.method == 'POST':
		if( create(data) ):
			return "Annotation added"
		else:
			return "Annotation error"
	if request.method == 'GET':
		return 1
	if request.method == 'PUT':
		if( change(data) ):
			return "Annotation changed"
		else:
			return "Update error"
	if request.method == 'DELETE':
		return 1
