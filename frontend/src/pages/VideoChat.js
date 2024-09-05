import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { useSubscription, gql } from '@apollo/client';

const ICE_CANDIDATE_SUBSCRIPTION = gql`
  subscription OnIceCandidate($callId: ID!) {
    iceCandidate(callId: $callId) {
      candidate
    }
  }
`;

const VideoChat = ({ callId }) => {
  const [stream, setStream] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);
  const [sock, setSock] = useState(null)
  const remoteVideoRef = useRef(null);
  const localVideoRef = useRef(null);

  useEffect(() => {
    const socket = io('http://localhost:4000'); // Update with your server URL

    socket.emit('join-room', callId);

    socket.on('signal', async (data) => {
      if (data.type === 'offer') {
        await handleOffer(data.offer);
      } else if (data.type === 'answer') {
        await handleAnswer(data.answer);
      }
    });

    socket.on('ice-candidate', async (candidate) => {
      if (peerConnection) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });
    setSock(socket)

    return () => {
      socket.disconnect();
    };
  }, [callId, peerConnection]);

  const handleOffer = async (offer) => {
    const pc = new RTCPeerConnection();
    setPeerConnection(pc);

    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        try {
          await fetch('http://localhost:4000/graphql', { // Update with your server URL
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: `
                mutation AddIceCandidate($callId: ID!, $candidate: String!) {
                  addIceCandidate(callId: $callId, candidate: $candidate)
                }
              `,
              variables: {
                callId,
                candidate: JSON.stringify(event.candidate),
              },
            }),
          });
        } catch (error) {
          console.error('Error sending ICE candidate:', error);
        }
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    await pc.setRemoteDescription(new RTCSessionDescription(offer));

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    // Send answer to remote peer
    // Ensure `socket` is within the same scope
    sock.emit('signal', {
      type: 'answer',
      answer,
    });

    const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    setStream(localStream);

    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  };

  const handleAnswer = async (answer) => {
    if (peerConnection) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }
  };

  // Use the ICE Candidate subscription if needed
  useSubscription(ICE_CANDIDATE_SUBSCRIPTION, {
    variables: { callId },
    onSubscriptionData: ({ subscriptionData }) => {
      const candidate = subscriptionData.data.iceCandidate.candidate;
      if (peerConnection && candidate) {
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    },
  });

  return (
    <div>
      <video ref={localVideoRef} autoPlay muted style={{ width: '300px' }} />
      <video ref={remoteVideoRef} autoPlay style={{ width: '300px' }} />
    </div>
  );
};

export default VideoChat;
