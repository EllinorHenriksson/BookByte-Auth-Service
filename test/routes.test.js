import request from 'supertest'
import { app } from '../src/server.js'
import { User } from '../src/models/user.js'

const ID = 'id'
const JWT = 'jwt'

let id
let jwt
let cookie

describe('hooks', function () {
  before(async function () {
    const user = await User.findOne({ username: 'TestPerson' })

    if (user) {
      await User.deleteOne({ username: user.username })
    }
  })

  describe('POST /register', function () {
    it('should return 201 json response if validation succeeds', function () {
      return request(app)
        .post('/api/v1/users/register')
        .send({
          username: 'TestPerson',
          givenName: 'Test',
          familyName: 'Person',
          email: 'test@person.com',
          password: 'thisisatest'
        })
        .set('Content-Type', 'application/json')
        .expect(201)
        .expect('Content-Type', /json/)
    })

    it('should return 400 json response if validation fails', function () {
      return request(app)
        .post('/api/v1/users/register')
        .send({
          username: 'TestPerson',
          givenName: 'Test',
          familyName: 'Person',
          email: 'test@person.com',
          password: 'test'
        })
        .set('Content-Type', 'application/json')
        .expect(400)
        .expect('Content-Type', /json/)
    })

    it('should return 409 json response if username/email is already registered', function () {
      return request(app)
        .post('/api/v1/users/register')
        .send({
          username: 'TestPerson',
          givenName: 'Test',
          familyName: 'Person',
          email: 'test@person.com',
          password: 'thisisatest'
        })
        .set('Content-Type', 'application/json')
        .expect(409)
        .expect('Content-Type', /json/)
    })
  })

  describe('POST /login', function () {
    it('should return 200 json response if credentials are correct', function () {
      return request(app)
        .post('/api/v1/users/login')
        .send({
          username: 'TestPerson',
          password: 'thisisatest'
        })
        .set('Content-Type', 'application/json')
        .expect(function (res) {
          cookie = res.headers['set-cookie'][0]
          jwt = res.body.jwt
          id = res.body.user.id

          res.body.jwt = JWT
          res.body.user.id = ID
        })
        .expect(200, {
          jwt: JWT,
          user: {
            username: 'TestPerson',
            givenName: 'Test',
            familyName: 'Person',
            email: 'test@person.com',
            id: ID
          }
        })
    })

    it('should return 401 json response if credentials are incorrect', function () {
      return request(app)
        .post('/api/v1/users/login')
        .send({
          username: 'TestPerson',
          password: 'wrongpassword'
        })
        .set('Content-Type', 'application/json')
        .expect(401)
        .expect('Content-Type', /json/)
    })

    it('should return 404 json response if active refresh token is provided', function () {
      return request(app)
        .post('/api/v1/users/login')
        .send({
          username: 'TestPerson',
          password: 'thisisatest'
        })
        .set('Content-Type', 'application/json')
        .set('Cookie', cookie)
        .expect(404)
        .expect('Content-Type', /json/)
    })
  })

  describe('POST /logout', function () {
    it('should return 200 json response if logout is successfull', function () {
      return request(app)
        .get('/api/v1/users/logout')
        .set('Authorization', `Bearer ${jwt}`)
        .set('Cookie', cookie)
        .expect(200)
        .expect('Content-Type', /json/)
    })

    it('should return 401 json response if jwt is invalid', function () {
      return request(app)
        .get('/api/v1/users/logout')
        .set('Cookie', cookie)
        .expect(401)
        .expect('Content-Type', /json/)
    })

    it('should return 401 json response if refresh token is invalid or not provided', function () {
      return request(app)
        .get('/api/v1/users/logout')
        .set('Authorization', `Bearer ${jwt}`)
        .expect(401)
        .expect('Content-Type', /json/)
    })
  })
})
