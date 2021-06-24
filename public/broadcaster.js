const videoGrid = document.getElementById('video-grid')
const videolElement = document.createElement('video')
videolElement.muted = true

videolElement.classList.add('me')

handleFilters(videolElement)

function handleFilters(video) {
  video.addEventListener('click', () => {
    currentFilterIndex = currentFilterIndex < filters.length - 1 ? currentFilterIndex + 1 : 0
    const currentFilter = filters[currentFilterIndex];
    console.log('currentFilter', currentFilter)
    video.style.filter = currentFilter
  })
}

async function init() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true })
  addUserVideoStream(videolElement, stream)
  const peer = creatPeer()
  stream.getTracks().forEach(track => peer.addTrack(track, stream))
}

function addUserVideoStream(video, stream) {
  video.srcObject = stream
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  videoGrid.append(video)
}

function creatPeer() {
  console.log('creating peer')
  const peer = new RTCPeerConnection({
    iceServers: [
      {
        urls: 'stun:stun.stunprotocol.org'
      }
    ]
  })

  peer.onnegotiationneeded = () => handleNegotiationNeeded(peer)

  return peer
}

async function handleNegotiationNeeded(peer) {
  const offer = await peer.createOffer()
  await peer.setLocalDescription(offer)

  const payload = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sdp: peer.localDescription
    })
  }

  const response = await fetch('/broadcast', payload)
  const { sdp }  = await response.json()

  const desc = new RTCSessionDescription(sdp)
  peer.setRemoteDescription(desc).catch(console.log)
}

init()