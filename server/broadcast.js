const webrtc = require('wrtc')

let senderStream;

const broadcast = app => {
  app.get('/broadcast', (req, res) => {
    res.render('broadcaster')
  })

  app.get('/view', (req, res) => {
    res.render('viewer')
  })

  app.post('/broadcast', async ({ body, res }) => {
    const peer = new webrtc.RTCPeerConnection({
      iceServers: [
        {
          urls: 'stun:stun.stunprotocol.org'
        }
      ]
    })
  
    peer.ontrack = e => handleTrackEvent(e, peer)


    const desc = new webrtc.RTCSessionDescription(body.sdp)
    await peer.setRemoteDescription(desc)
    const answer = await peer.createAnswer()
    await peer.setLocalDescription(answer)

    const payload = {
      sdp: peer.localDescription
    }
  
    res.json(payload)
  })

  app.post('/consumer', async ({ body }, res) => {
    const peer = new webrtc.RTCPeerConnection({
      iceServers: [
        {
          urls: 'stun:stun.stunprotocol.org'
        }
      ]
    })

    const desc = new webrtc.RTCSessionDescription(body.sdp)
    await peer.setRemoteDescription(desc)

    senderStream.getTracks().forEach(track =>
      peer.addTrack(track, senderStream)
    )

    const answer = await peer.createAnswer()
    await peer.setLocalDescription(answer)

    const payload = {
      sdp: peer.localDescription
    }
  
    res.json(payload)
  })
}

const handleTrackEvent = (e, peer) => {
  senderStream = e.streams[0]
}

module.exports = broadcast