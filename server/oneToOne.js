const { v4: uuidv4 } = require('uuid')

const rooms = {}

const oneToOne = (app, io) => {
  app.get('/', (req, res) => {
    res.redirect(`/${uuidv4()}`)
  })

  app.get('/:room', (req, res) => {
    res.render('room', { roomId: req.params.room })
  })

  io.on('connection', socket => {
    socket.on('join room', (roomId) => {
      console.log('user', socket.id, 'joined the room', roomId)
      if (rooms[roomId]) {
        rooms[roomId].push(socket.id)
      } else {
        rooms[roomId] = [socket.id]
      }

      const otherUser = rooms[roomId].find(id => id != socket.id)
      console.log('otherUser', otherUser)

      if (otherUser) {
        socket.emit('other user', otherUser)
        socket.to(otherUser).emit('user joined', socket.id)
      }
    })

    socket.on('offer', payload => {
      io.to(payload.target).emit('offer', payload)
    })

    socket.on('answer', payload => {
      io.to(payload.target).emit('answer', payload)
    })

    socket.on('ice-candidate', incoming => {
      io.to(incoming.target).emit('ice-candidate', incoming.candidate)
    })
  })
}

module.exports = oneToOne