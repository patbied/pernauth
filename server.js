const express = require('express')
const app = express()
const userRouter = require('./routes/users')
const session = require('express-session')
const PORT = 5000
const pgSession = require('connect-pg-simple')(session)
const {pool} = require('./dbconfig')
const cors = require('cors')
require('dotenv').config()
app.listen(PORT, ()=> {
console.log(`Server running on port ${PORT}`)
})

const sessionStore = new pgSession({
    pool: pool,
    tableName: 'user_session'
})
//Middleware
app.use(express.urlencoded({extended: false}))
app.use(express.json())
app.use(session({
    store: sessionStore,
    secret: process.env.COOKIE_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: false,
        sameSite: false,
        maxAge: 1000 * 60 * 60 * 24,
    },
}))
app.use(
    cors({
        origin: 'http://localhost:3000',
        methods: ['POST', 'PUT', 'GET', 'OPTIONS', 'HEAD'],
        credentials: true,
    })
)

//Routes
app.use('/user', userRouter)
app.get('/', (req, res) => {
    console.log(req.session.id)
    res.send("hello")
})
