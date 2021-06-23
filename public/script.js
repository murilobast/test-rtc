const socket = io('/')
const videoGrid = document.getElementById('video-grid')
const mainPeer = new Peer(undefined, {
  host: '/',
  port: '3001'
})
const videolElement = document.createElement('video')
const peers = {}
const filters = ['unset', 'sepia(1)', 'grayscale(1)', 'hue-rotate(300deg)', 'invert(1)'];
let currentFilterIndex = 0;

videolElement.muted = true
videolElement.classList.add('me')

handleFilters(videolElement)

function initApp() {
  navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  }).then(stream => {
    addUserVideoStream(videolElement, stream)
  
    mainPeer.on('call', call => {
      call.answer(stream)
      const video = document.createElement('video')
  
      call.on('stream', userVideoStrem => {
        addUserVideoStream(video, userVideoStrem)
      })
    })
  
    socket.on('user-connected', userId => {
      console.log('user connected', userId)
      makeUserConnection(userId, stream)
    })
  })
  
  socket.on('user-disconnected', userId => {
    console.log('user disconnected', userId)
    peers[userId]?.close()
  })
  
  mainPeer.on('open', id => {
    socket.emit('join-room', ROOM_ID, id)
  })
}

function handleFilters(video) {
  video.addEventListener('click', () => {
    currentFilterIndex = currentFilterIndex < filters.length - 1 ? currentFilterIndex + 1 : 0
    const currentFilter = filters[currentFilterIndex];
    console.log('currentFilter', currentFilter)
    video.style.filter = currentFilter
  })
}

function addUserVideoStream(video, stream) {
  video.srcObject = stream
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  videoGrid.append(video)
}

function makeUserConnection(userId, stream) {
  const call = mainPeer.call(userId, stream)
  const video = document.createElement('video')

  call.on('stream', userVideoStrem => {
    console.log('stream init')
    addUserVideoStream(video, userVideoStrem)
  })

  call.on('close', () => {
    console.log('stream close')
    video.remove()
  })

  peers[userId] = call
}

initApp()