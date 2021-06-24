const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)

const broadcast = require('./broadcast')
const oneToOne = require('./oneToOne')

app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({ extended: true}))

broadcast(app)
oneToOne(app, io)

server.listen(3000)