# authserver
A central token based auth server to add openid or other login types. Use this as an API server for your backend to request tokens, set expirations and handle federated logins. It includes Steam as an example. Useful if you want to share logins across several sites.

# Getting Started
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

# API
Use these calls to generate tokens for clients and login through third parties

## Authorization
  All requests must provide Auth token which matches ADMIN_TOKEN in .env   
  It can be provided in the following ways:   
  - Header   
    `{authorization:'Bearer token'}`   
  - Data Param   
    `{access_token:'token'}`   
  - URL Param   
    `access_token=token`   

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
  - Code 401   
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
  /:token   
- Method   
  PUT   
- Data Params   
  JSON Object which will be merged with user data. This can overwrite existing keys, so be careful   

     ```js
     {
       customkey:{
         id:'customuserid',   
         username: 'customusername',   
         email: 'users email',
         //etc.. 
       }
     }
     ```
- Success   
  - Code 200   
  - Content    
    Returns updated token data

    ```js
    {
      customkey:{/*custom userdata*/},
      //keys below here already existed on token
      steam:{/*steam auth data*/},
      expires://expiration timestamp
    }
    ```
- Error    
  - Code 500   
    Not Authorized   
  
## Login to Steam
Redirect to steam open id login to allow client to login
- URL   
  /steam/auth/:token   
- Method   
  GET   
- URL Params   
  Required:    
  `onsuccess=//url to return client to after auth`   
  Optional:   
  `onfailure=//url to return client if auth fails` defaults to `onsuccess`   
- Success   
  - Code 300 Redirect   
- Error   
  - Code 404   
    Token not found   
  - Code 500  
    Not Authorized    

## Steam User Data
this gets parsed out of a successful steam login and attached to the token
 
   ```js
   steam:{
     steamid: player.steamid
     username: player.personname,
     name: player.realname,
     profile: player.profileurl,
     avatar: {
       small: player.avatar,
       medium: player.avatarmedium,
       large: player.avatarfull
     }
   }
   ```
