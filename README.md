# authserver
a central token based auth server to add openid or other login types. includes steam openid auth module.

# getting started
`git clone http://github.com/daywiss/authserver`

```
cd authserver
npm install 
cp example.env .env
//edit .env and replace with your config
npm start 
```

# .env configuration
View example.env for properties

#usage
Once the server is started

Access token can also be set in the http header request as
```request.set('authorization','bearer testtoken')```

# API
Once the server is running, use these calls to generate tokens for clients and login through third parties

## Authorization
  All requests must provide Auth token which matches ADMIN_TOKEN in .env   
  It can be provided in the following ways:
  - Header
    `{authorization:'Bearer token'}`
  - Data Param
    `{access_token:'token'}`
  - URL Param
    `aceess_token=token`

## Generate Client Token
- URL 
  /
- Method 
  POST
- Data Params
  optional:
  `{duration=ms until token expires}`
- Success 
  - Code 200
    Content `{token:string, expires:timestamp of expiration date}`
- Error
  - Code 500
    Not Authorized


## Renew Token
Add time to token expiration date
- URL 
  /:token
- Method 
  POST
- Data Params
  optional:
  `{duration=ms until token expires}` will default to 24 hours if not supplied
- Success 
  - Code 200
    Content `{token:string, expires:timestamp of expiration date}`
- Error
  - Code 404
    Token not found
  - Code 500
    Not Authorized

## Delete/Logout 
Remove token, effectively logging client out
- URL 
  /:token
- Method   
  DELETE
- Success 
  - Code 200
    Content true
- Error
  - Code 404
    Token not found
  - Code 500
    Not Authorized

## Login to Steam
Redirect to steam open id login to allow client to login
- URL
  /steam/auth
- Method
  GET
- URL Params
  Required:   
  `successurl=//url to return client to after auth`   
  `token=//client token`   
  Optional:   
  `failurl=//url to return client if auth fails` defaults to `successurl`
- Success
  - Code 300 Redirect
- Error
  - Code 404
    Token not found
  - Code 500
    Not Authorized 

## Verify Login and Get user data
Gets login data about token from Steam or other third party logins
- URL
  /:token
- Method
  GET
- Success
  - Code 200
  - Content 
    if user has logged into steam `{steam:{//steam data}, expires:long}`   
    if not logged in `{expires:long}`   
- Error
  - Code 404
    Token not found
  - Code 500
    Not Authorized

## Get All Tokens/User Data
- URL
  /
- Method
  GET
- Success
  - Code 200
  - Content  
    `[//array of tokens/user data]`
- Error
  - Code 500
    Not Authorized

## Update Token with custom data
Use this to update token with custom user data. For example, the client logs into steam, which then authorizes your site, you can attach your sites user data to token. 
- URL  
  :key cannot be reserved words: `expires` or `token`
  /:key
- Method
  PUT
- Data Params
  JSON Object which will be keyed by :key
  - Example   
     ```
     {
       id:'customuserid',   
       username: 'customusername',   
       email: 'users email'   
       //etc.. 
     }
     ```

