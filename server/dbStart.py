import sqlite3

conn = sqlite3.connect('rave.db')
print ("Opened database successfully")

conn.execute('''CREATE TABLE users
             (email varchar(50) PRIMARY KEY,
              password varchar(20) NOT NULL,
			  name varchar(20))''')

print ("Table created successfully")
conn.close()