/* eslint-disable no-unused-expressions */
import { app } from '../src/server.js'
import { User } from '../src/models/user.js'
import chai from 'chai'
import chaiHttp from 'chai-http'

const expect = chai.expect

chai.use(chaiHttp)

let agent, id, jwt

describe('hooks', () => {
  before(async () => {
    const user = await User.findOne({ username: 'TestPerson' })

    if (user) {
      await User.deleteOne({ username: user.username })
    }

    agent = chai.request.agent(app)
  })

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

  describe('POST /login', function () {
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

  describe('POST /logout', function () {
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

    it('should return 401 json response if refresh token is invalid or not provided', done => {
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
})
