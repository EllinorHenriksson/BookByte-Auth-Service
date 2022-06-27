/* eslint-disable no-unused-expressions */
import { app } from '../src/server.js'
import { User } from '../src/models/user.js'
import chai from 'chai'
import chaiHttp from 'chai-http'

const expect = chai.expect

chai.use(chaiHttp)

let agent, id, jwt

describe('test suite for api routes', () => {
  // eslint-disable-next-line no-undef
  before(async () => {
    const user1 = await User.findOne({ username: 'TestPerson' })

    if (user1) {
      await User.deleteOne({ username: user1.username })
    }

    let user2 = await User.findOne({ username: 'TestPerson2' })

    if (!user2) {
      user2 = new User({
        username: 'TestPerson2',
        givenName: 'Test',
        familyName: 'Person2',
        email: 'test@person2.com',
        password: 'thisisanothertest'
      })

      await user2.save()
    }

    agent = chai.request.agent(app)
  })

  // eslint-disable-next-line no-undef
  after(() => {
    agent.close()
  })

  describe('POST /register', () => {
    it('should return 201 json response if validation succeeds', done => {
      agent
        .post('/api/v1/users/register')
        .send({
          username: 'TestPerson',
          givenName: 'Test',
          familyName: 'Person',
          email: 'test@person.com',
          password: 'thisisatest'
        })
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(201)

          expect(res).to.be.json
          expect(res.body).to.be.an('object').that.has.property('id')

          id = res.body.id

          done()
        })
    })

    it('should return 400 json response if validation fails', done => {
      agent
        .post('/api/v1/users/register')
        .send({
          username: 'TestPerson',
          givenName: 'Test',
          familyName: 'Person',
          email: 'test@person.com',
          password: 'test'
        })
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(400)

          expect(res).to.be.json
          expect(res.body).to.be.an('object').that.includes.all.keys('status', 'message')

          done()
        })
    })

    it('should return 409 json response if username/email is already registered', done => {
      agent
        .post('/api/v1/users/register')
        .send({
          username: 'TestPerson',
          givenName: 'Test',
          familyName: 'Person',
          email: 'test@person.com',
          password: 'thisisatest'
        })
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(409)

          expect(res).to.be.json
          expect(res.body).to.be.an('object').that.includes.all.keys('status', 'message')

          done()
        })
    })
  })

  describe('POST /login', () => {
    it('should return 200 json response if credentials are correct', done => {
      agent
        .post('/api/v1/users/login')
        .send({
          username: 'TestPerson',
          password: 'thisisatest'
        })
        .set('Content-Type', 'application/json')
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(200)

          expect(res).to.be.json
          expect(res.body).to.be.an('object').that.has.all.keys('jwt', 'user')
          expect(res.body.user).to.deep.equal({
            username: 'TestPerson',
            givenName: 'Test',
            familyName: 'Person',
            email: 'test@person.com',
            id
          })

          expect(res).to.have.cookie('refreshToken')

          jwt = res.body.jwt

          done()
        })
    })

    it('should return 401 json response if credentials are incorrect', done => {
      chai.request(app)
        .post('/api/v1/users/login')
        .send({
          username: 'TestPerson',
          password: 'wrongpassword'
        })
        .set('Content-Type', 'application/json')
        .set('Cookie', '')
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(401)

          expect(res).to.be.json
          expect(res.body).to.be.an('object').that.includes.all.keys('status', 'message')

          done()
        })
    })

    it('should return 404 json response if active refresh token is provided', done => {
      agent
        .post('/api/v1/users/login')
        .send({
          username: 'TestPerson',
          password: 'thisisatest'
        })
        .set('Content-Type', 'application/json')
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(404)

          expect(res).to.be.json
          expect(res.body).to.be.an('object').that.includes.all.keys('status', 'message')

          done()
        })
    })
  })

  describe('GET /refresh', () => {
    it('should return 200 json response if refresh is successfull', done => {
      agent
        .get('/api/v1/users/refresh')
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(200)

          expect(res).to.be.json
          expect(res.body).to.be.an('object').that.has.all.keys('jwt', 'user')
          expect(res.body.user).to.deep.equal({
            username: 'TestPerson',
            givenName: 'Test',
            familyName: 'Person',
            email: 'test@person.com',
            id
          })

          expect(res).to.have.cookie('refreshToken')

          jwt = res.body.jwt

          done()
        })
    })

    it('should return 401 json response if refresh token is invalid', done => {
      chai.request(app)
        .get('/api/v1/users/refresh')
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(401)

          expect(res).to.be.json
          expect(res.body).to.be.an('object').that.includes.all.keys('status', 'message')

          done()
        })
    })
  })

  describe('GET /logout', () => {
    it('should return 200 json response if logout is successfull', done => {
      agent
        .get('/api/v1/users/logout')
        .auth(jwt, { type: 'bearer' })
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(200)

          expect(res).to.be.json
          expect(res.body).to.be.an('object').that.has.property('message')

          done()
        })
    })

    it('should return 401 json response if jwt is invalid', done => {
      agent
        .get('/api/v1/users/logout')
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(401)

          expect(res).to.be.json
          expect(res.body).to.be.an('object').that.includes.all.keys('status', 'message')

          done()
        })
    })

    it('should return 401 json response if refresh token is invalid', done => {
      chai.request(app)
        .get('/api/v1/users/logout')
        .auth(jwt, { type: 'bearer' })
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(401)

          expect(res).to.be.json
          expect(res.body).to.be.an('object').that.includes.all.keys('status', 'message')

          done()
        })
    })
  })

  describe('GET /account', () => {
    it('should return 200 json response if successful', done => {
      agent
        .post('/api/v1/users/login')
        .send({
          username: 'TestPerson',
          password: 'thisisatest'
        })
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(200)

          expect(res).to.be.json
          expect(res.body).to.be.an('object').that.has.all.keys('jwt', 'user')
          expect(res.body.user).to.deep.equal({
            username: 'TestPerson',
            givenName: 'Test',
            familyName: 'Person',
            email: 'test@person.com',
            id
          })

          expect(res).to.have.cookie('refreshToken')

          jwt = res.body.jwt

          agent
            .get('/api/v1/users/account')
            .auth(jwt, { type: 'bearer' })
            .end((err, res) => {
              expect(err).to.be.null
              expect(res).to.have.status(200)

              expect(res).to.be.json
              expect(res.body).to.deep.equal({
                username: 'TestPerson',
                givenName: 'Test',
                familyName: 'Person',
                email: 'test@person.com',
                id
              })
              done()
            })
        })
    })

    it('should return 401 json response if jwt is invalid', done => {
      agent
        .get('/api/v1/users/account')
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(401)

          expect(res).to.be.json
          expect(res.body).to.be.an('object').that.includes.all.keys('status', 'message')

          done()
        })
    })
  })

  describe('PATCH /account', () => {
    it('should return 204 response if successfull', done => {
      agent
        .patch('/api/v1/users/account')
        .send({
          givenName: 'Test Mocha'
        })
        .set('Content-Type', 'application/json')
        .auth(jwt, { type: 'bearer' })
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(204)

          done()
        })
    })

    it('should return 400 json response if validation fails', done => {
      agent
        .patch('/api/v1/users/account')
        .send({
          email: 'test@person'
        })
        .set('Content-Type', 'application/json')
        .auth(jwt, { type: 'bearer' })
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(400)

          expect(res).to.be.json
          expect(res.body).to.be.an('object').that.includes.all.keys('status', 'message')

          done()
        })
    })

    it('should return 401 json response if jwt is invalid', done => {
      agent
        .patch('/api/v1/users/account')
        .send({
          givenName: 'Test Mocha'
        })
        .set('Content-Type', 'application/json')
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(401)

          expect(res).to.be.json
          expect(res.body).to.be.an('object').that.includes.all.keys('status', 'message')

          done()
        })
    })

    it('should return 409 json response if username/email is already registered', done => {
      agent
        .patch('/api/v1/users/account')
        .send({
          username: 'TestPerson2'
        })
        .set('Content-Type', 'application/json')
        .auth(jwt, { type: 'bearer' })
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(409)

          expect(res).to.be.json
          expect(res.body).to.be.an('object').that.includes.all.keys('status', 'message')

          done()
        })
    })
  })

  describe('PUT /account', () => {
    it('should return 204 response if successful', done => {
      agent
        .put('/api/v1/users/account')
        .send({
          username: 'TestPerson',
          givenName: 'Test Mocha Chai',
          familyName: 'Test-Person',
          email: 'test@person.com',
          oldPassword: 'thisisatest',
          newPassword: 'thisisanewtest'
        })
        .set('Content-Type', 'application/json')
        .auth(jwt, { type: 'bearer' })
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(204)

          done()
        })
    })

    it('should return 400 json response if validation fails', done => {
      agent
        .put('/api/v1/users/account')
        .send({
          givenName: 'Test Mocha Chai',
          familyName: 'Test-Person',
          email: 'test@person.com',
          oldPassword: 'thisisanewtest',
          newPassword: 'thisisatest'
        })
        .set('Content-Type', 'application/json')
        .auth(jwt, { type: 'bearer' })
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(400)

          expect(res).to.be.json
          expect(res.body).to.be.an('object').that.includes.all.keys('status', 'message')

          done()
        })
    })

    it('should return 401 json response if jwt is invalid', done => {
      agent
        .put('/api/v1/users/account')
        .send({
          username: 'TestPerson',
          givenName: 'Test Mocha Chai',
          familyName: 'Test-Person',
          email: 'test@person.com',
          oldPassword: 'thisisatest',
          newPassword: 'thisisanewtest'
        })
        .set('Content-Type', 'application/json')
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(401)

          expect(res).to.be.json
          expect(res.body).to.be.an('object').that.includes.all.keys('status', 'message')

          done()
        })
    })

    it('should return 409 json response if username/email is already registered', done => {
      agent
        .put('/api/v1/users/account')
        .send({
          username: 'TestPerson2',
          givenName: 'Test Mocha Chai',
          familyName: 'Test-Person',
          email: 'test@person.com',
          oldPassword: 'thisisanewtest',
          newPassword: 'thisisatest'
        })
        .set('Content-Type', 'application/json')
        .auth(jwt, { type: 'bearer' })
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(409)

          expect(res).to.be.json
          expect(res.body).to.be.an('object').that.includes.all.keys('status', 'message')

          done()
        })
    })
  })

  describe('GET /users/:id', () => {
    it('should return 200 json response if successful', done => {
      agent
        .get(`/api/v1/users/${id}`)
        .auth(jwt, { type: 'bearer' })
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(200)

          expect(res).to.be.json
          expect(res.body).to.deep.equal({
            username: 'TestPerson',
            givenName: 'Test Mocha Chai',
            familyName: 'Test-Person',
            email: 'test@person.com',
            id
          })

          done()
        })
    })

    it('should return 401 json response if jwt is invalid', done => {
      agent
        .get(`/api/v1/users/${id}`)
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(401)

          expect(res).to.be.json
          expect(res.body).to.be.an('object').that.includes.all.keys('status', 'message')

          done()
        })
    })

    it('should return 404 json response if the requested resource does not exist', done => {
      agent
        .get('/api/v1/users/123')
        .auth(jwt, { type: 'bearer' })
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(404)

          expect(res).to.be.json
          expect(res.body).to.be.an('object').that.includes.all.keys('status', 'message')

          done()
        })
    })
  })

  describe('DELETE /account', () => {
    it('should return 401 json response if jwt is invalid', done => {
      agent
        .delete('/api/v1/users/account')
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(401)

          expect(res).to.be.json
          expect(res.body).to.be.an('object').that.includes.all.keys('status', 'message')

          done()
        })
    })

    it('should return 204 response if successful', done => {
      agent
        .delete('/api/v1/users/account')
        .auth(jwt, { type: 'bearer' })
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(204)

          done()
        })
    })
  })
})
