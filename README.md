# authserver
a central token based auth server to add openid or other login types

#getting started
```
git clone http://github.com/daywiss/authserver
cd authserver
npm install 
cp dotenv.example .env
//edit .env and replace with your config
npm start 
```
#usage
the auth server comes with a steam open id implementation. visit:   
[http://localhost:3000/steam/auth?access_token=testtoken](http://localhost:3000/steam/auth?access_token=testtoken)   
login to steam then to retreive the steam user data visit:  
[http://localhost:3000?access_token=testtoken](http://localhost:3000?access_token=testtoken)   
[http://localhost:3000/steam?access_token=testtoken](http://localhost:3000/steam?access_token=testtoken)   

Access token can also be set in the http header request as
```request.set('authorization','bearer testtoken')```
