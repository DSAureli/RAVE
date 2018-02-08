import sqlite3

conn = sqlite3.connect('rave.db')
print ("Opened database successfully")

conn.execute('''CREATE TABLE users
             (email varchar(50) PRIMARY KEY,
              password varchar(20) NOT NULL,
			  name varchar(20))''')

conn.execute('''CREATE TABLE annotations
             (id text PRIMARY KEY,
              user text NOT NULL,
			  page text NOT NULL,
			  version real NOT NULL,
			  public integer NOT NULL,
			  annotation text NOT NULL,
			  array text NOT NULL)''')

conn.execute('''CREATE TABLE versions
             (page text PRIMARY KEY,
			  version real NOT NULL)''')

print ("Table created successfully")
conn.close()