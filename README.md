# Auth Service

## Description
Auth Service is an authentication and user handling microservice that together with another microservice (Resource Service) and the client application BookByte provides users with the opportunity to add books they wish to read and books they own, pairs the books with the books of other users, and presents swap suggestions.

## Techniques
The application is written in Express and uses Mongoose as an ODM to communicate with MongoDB databases that are used to store user data and refresh token data. The MongoDB databases are set up with a local Docker container.

Auth Service implements JWT and refresh tokens to authenticate users and keep them authenticated. The JWT is sent in the response body, while the refresh token is sent as a cookie. Other data is sent back as JSON.

## Hosting
The application is hosted on my personal CS-Cloud machine and has the following URL:

https://cscloud7-240.lnu.se/bookbyte/api/v1/users/

## Routes  

### POST /register

#### Request
- Body: `{ username: String, givenName: String, familyName: String, email: String, password: String }`

#### Response

##### Success
- Status: 201
- Body: `{ id: String }`

##### Error
- Status: 400; body: `{ status: 400, message: \*Validation error\*}`
- Status: 404; body: `{ status: 404, message: 'Not Found' }`
- Status: 409; body: `{ status: 409; message: 'Username and/or email address already registered' }`
- Status: 500; body: `{ status: 500, message: 'An unexpected condition was encountered' }`  

### POST /login

#### Request
- Body: `{ username: String, password: String }`

#### Response

##### Success
- Status: 200
- Body:   
`{
  jwt: \*JWT\*,
  user: {
    givenName: String,
    familyName: String,
    email: String,
    username: String,
    id: String
  }
}`
- Cookie: refreshToken

##### Error
- Status: 401; body: `{ status: 401, message: 'Credentials invalid or not provided' }`
- Status: 404; body: `{ status: 404, message: 'Not Found' }`
- Status: 500; body: `{ status: 500, message: 'An unexpected condition was encountered' }`  

### GET /refresh

#### Request
- Cookie: refreshToken

#### Response

##### Success
- Status: 200
- Body:   
`{
  jwt: \*JWT\*,
  user: {
    givenName: String,
    familyName: String,
    email: String,
    username: String,
    id: String
  }
}`
- Cookie: refreshToken

##### Error
- Status: 401, body: `{ status: 401, message: 'Refresh token invalid or not provided' }`
- Status: 500; body: `{ status: 500, message: 'An unexpected condition was encountered' }`  

### GET /logout

#### Request
- Authorization: Bearer \*JWT\*
- Cookie: refreshToken

#### Response

##### Success
- Status: 200
- Body: `{ message: 'Refresh token revoked' }`

##### Error
- Status: 401; body: `{ status: 401, message: 'JWT invalid or not provided' }`
- Status: 401; body: `{ status: 401, message: 'Refresh token invalid or not provided' }`
- Status: 500; body: `{ status: 401, message: 'An unexpected condition was encountered' }`  

### GET /account

#### Request
- Authorization: Bearer \*JWT\*

#### Response

##### Success
- Status: 200
- Body:   
`{
  id: String,
  username: String, 
  givenName: String, 
  familyName: String, 
  email: String
}`

##### Error
- Status: 401; body: `{ status: 401, message: 'JWT invalid or not provided' }`
- Status: 500; body: `{ status: 500, message: 'An unexpected condition was encountered' }` 

### PATCH /account

#### Request
- Authorization: Bearer \*JWT\*
- Body (can be any of the properties, but if old/new password is sent, new/old password must also be sent):   
`{
  username: String,
  givenName: String,
  familyName: String,
  email: String,
  oldPassword: String,
  newPassword: String
}`

#### Response

##### Success
- Status: 204

##### Error
- Status: 400; body: `{ status: 400, message: \*Validation error\* }`
- Status: 401; body: `{ status: 401, message: 'JWT invalid or not provided' }`
- Status: 409; body: `{ status: 409, message: 'Username and/or email address already registered' }`
- Status: 500; body: `{ status: 500, message: 'An unexpected condition was encountered' }`  

### PUT /account

#### Request
- Authorization: Bearer \*JWT\*
- Body (must be all of the properties):   
`{   
  username: String,   
  givenName: String,   
  familyName: String,   
  email: String,   
  oldPassword: String,   
  newPassword: String   
}`

#### Response

##### Success
- Status: 204

##### Error
- Status: 400; body: `{ status: 400, message: *Validation error* }`
- Status: 401; body: `{ status: 401, message: 'JWT invalid or not provided' }`
- Status: 409; body: `{ status: 409, message: 'Username and/or email address already registered' }`
- Status: 500; body: `{ status: 500, message: 'An unexpected condition was encountered' }`  

### DELETE /account

#### Request
- Authorization: Bearer \*JWT\*

#### Response

##### Success
- Status: 204

##### Error
- Status: 401; body: `{ status: 401, message: 'JWT invalid or not provided' }`
- Status: 500; body: `{ status: 500, message: 'An unexpected condition was encountered' }`  

### GET /:id

#### Request
- Authorization: Bearer \*JWT\*

#### Response

##### Success
- Status: 200
- Body: `{ id: String, username: String, givenName: String, familyName: String, email: String }`

##### Error
- Status: 401; body: `{ status: 401, message: 'JWT invalid or not provided' }`
- Status: 404; body: `{ status: 404, message: 'The requested resource was not found' }`
- Status: 500; body: `{ status: 500, message: 'An unexpected condition was encountered' }`