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
      if (rooms[roomId]) {
        console.log('user', socket.id, 'joined room', roomId)
        rooms[roomId].push(socket.id)
      } else {
        console.log('user', socket.id, 'created room', roomId)
        rooms[roomId] = [socket.id]
      }

      const otherUser = rooms[roomId].find(id => id !== socket.id);
      if (otherUser) {
        socket.emit("other user", otherUser);
        socket.to(otherUser).emit("user joined", socket.id);
      }
    })

    socket.on("offer", payload => {
      io.to(payload.target).emit("offer", payload);
    })

    socket.on("answer", payload => {
      io.to(payload.target).emit("answer", payload);
    })

    socket.on("ice-candidate", incoming => {
      io.to(incoming.target).emit("ice-candidate", incoming.candidate);
    })

    socket.on('disconnect', () => {
      console.log('user disconcected')
      const currentRoomId = Object.keys(rooms).find(key => {
        return rooms[key].includes(socket.id)
      })

      if (currentRoomId) {
        console.log('removing user', socket.id, 'from room', currentRoomId)
        rooms[currentRoomId] = rooms[currentRoomId].filter(id => id != socket.id)

        rooms[currentRoomId].forEach(userId => {
          io.to(userId).emit("leave room", socket.id);
        });
      }
    })
  })
}

module.exports = oneToOne