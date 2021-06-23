const socket = io('/')
const videoGrid = document.getElementById('video-grid')
const mainPeer = new Peer(undefined, {
  host: '/',
  port: '3001'
})
const videolElement = document.createElement('video')
videolElement.muted = true
const peers = {}

navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  addVideoStream(videolElement, stream)

  mainPeer.on('call', call => {
    call.answer(stream)
    const video = document.createElement('video')
    call.on('stream', userVideoStrem => {
      addVideoStream(video, userVideoStrem)
    })
  })

  socket.on('user-connected', userId => {
    console.log('user connected', userId)
    connectToNewUser(userId, stream)
  })
})

socket.on('user-disconnected', userId => {
  console.log('user disconnected', userId)
  peers[userId]?.close()
})

mainPeer.on('open', id => {
  socket.emit('join-room', ROOM_ID, id)
})

function addVideoStream(video, stream) {
  video.srcObject = stream
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  videoGrid.append(video)
}

function connectToNewUser(userId, stream) {
  const call = mainPeer.call(userId, stream)
  const video = document.createElement('video')
  call.on('stream', userVideoStrem => {
    console.log('stream init')
    addVideoStream(video, userVideoStrem)
  })
  call.on('close', () => {
    console.log('stream close')
    video.remove()
  })

  peers[userId] = call
}