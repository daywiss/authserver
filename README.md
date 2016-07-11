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
the auth server comes with a steam open id implementation. visit
localhost:3000/steam/auth?access_token='test'
login to steam then visit
localhost:3000/steam?access_token='test'
to retreive the steam user data
