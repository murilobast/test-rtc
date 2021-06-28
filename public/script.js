const socket = io('/')
const videoGrid = document.getElementById('video-grid')
const localVideolElement = document.createElement('video')
const remoteVideolElement = document.createElement('video')
const filters = ['unset', 'sepia(1)', 'grayscale(1)', 'hue-rotate(300deg)', 'invert(1)']
let currentFilterIndex = 0

localVideolElement.muted = true
localVideolElement.classList.add('me')
remoteVideolElement.classList.add('other')

localVideolElement.setAttribute('playsinline', true)
remoteVideolElement.setAttribute('playsinline', true)

let peer
let userStream
let remoteUserId

async function init() {
  userStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })

  addUserVideoStream(localVideolElement, userStream)

  socket.emit('join room', ROOM_ID)

  socket.on('other user', userID => {
      callUser(userID)
      remoteUserId = userID
  })

  socket.on('user joined', userID => {
      remoteUserId = userID
  })

  socket.on('offer', handleRecieveCall)

  socket.on('answer', handleAnswer)
  
  socket.on('leave room', handleUserDisconnected)

  socket.on('ice-candidate', handleNewICECandidateMsg)
}

function handleUserDisconnected() {
  const currentRemoteVideoElement = document.querySelector('.other')

  if (currentRemoteVideoElement) {
    currentRemoteVideoElement.remove()
    const remoteVideolElement = document.createElement('video')
    remoteVideolElement.classList.add('other')
    remoteVideolElement.setAttribute('playsinline', true)
  }
}

function callUser(userID) {
  peer = createPeer(userID)
  userStream.getTracks().forEach(track => peer.addTrack(track, userStream))
}

function createPeer(userID) {
  const peer = new RTCPeerConnection({
      iceServers: [
          {
              urls: 'stun:stun.stunprotocol.org'
          },
          {
              urls: 'turn:numb.viagenie.ca',
              credential: 'muazkh',
              username: 'webrtc@live.com'
          },
      ]
  })

  peer.onicecandidate = handleICECandidateEvent
  peer.ontrack = handleTrackEvent
  peer.onnegotiationneeded = () => handleNegotiationNeededEvent(userID)

  return peer
}

async function handleNegotiationNeededEvent(userID) {
  try {

    const offer = await peer.createOffer()
    await peer.setLocalDescription(offer)
    const payload = {
        target: userID,
        caller: socket.id,
        sdp: peer.localDescription
    }
    socket.emit('offer', payload)
  } catch (e) {
    console.log('handleNegotiationNeededEvent error', e)
  }
}

async function handleRecieveCall(incoming) {
  peer = createPeer()
  const desc = new RTCSessionDescription(incoming.sdp)
  await peer.setRemoteDescription(desc)
  userStream.getTracks().forEach(track => peer.addTrack(track, userStream))
  const answer = await peer.createAnswer()
  await peer.setLocalDescription(answer)
  const payload = {
      target: incoming.caller,
      caller: socket.id,
      sdp: peer.localDescription
  }
  socket.emit('answer', payload)
}

async function handleAnswer(message) {
  try {
    const desc = new RTCSessionDescription(message.sdp)
    await peer.setRemoteDescription(desc)
  } catch (e) {
    console.log('handleAnswer error', e)
  }
}

function handleICECandidateEvent(e) {
  if (e.candidate) {
    const payload = {
      target: remoteUserId,
      candidate: e.candidate,
    }
    socket.emit('ice-candidate', payload)
  }
}

async function handleNewICECandidateMsg(incoming) {
  try {
    const candidate = new RTCIceCandidate(incoming)
    await peer.addIceCandidate(candidate)
  } catch (e) {
    console.log('handleNewICECandidateMsg error', e)
  }
}

function handleTrackEvent(e) {
  addUserVideoStream(remoteVideolElement, e.streams[0])
}

function handleFilters(video) {
  video.addEventListener('click', () => {
    currentFilterIndex = currentFilterIndex < filters.length - 1 ? currentFilterIndex + 1 : 0
    const currentFilter = filters[currentFilterIndex]
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

init()
handleFilters(localVideolElement)