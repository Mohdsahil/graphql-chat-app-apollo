import React, { useState, useEffect } from 'react';
import { useMutation, useSubscription, gql } from '@apollo/client';
import VideoChat from './VideoChat';

const START_VIDEO_CALL = gql`
  mutation StartVideoCall($receiverId: ID!) {
    startVideoCall(receiverId: $receiverId) {
      id
      status
    }
  }
`;

const ACCEPT_VIDEO_CALL = gql`
  mutation AcceptVideoCall($callId: ID!) {
    acceptVideoCall(callId: $callId) {
      id
      status
    }
  }
`;

const REJECT_VIDEO_CALL = gql`
  mutation RejectVideoCall($callId: ID!) {
    rejectVideoCall(callId: $callId) {
      id
      status
    }
  }
`;

const INCOMING_VIDEO_CALL = gql`
  subscription IncomingVideoCall($receiverId: ID!) {
    incomingVideoCall(receiverId: $receiverId) {
      id
      callerId
      receiverId
      status
    }
  }
`;

const VIDEO_CALL_ACCEPTED = gql`
  subscription VideoCallAccepted($callId: ID!) {
    videoCallAccepted(callId: $callId) {
      id
      status
    }
  }
`;

const VIDEO_CALL_REJECTED = gql`
  subscription VideoCallRejected($callId: ID!) {
    videoCallRejected(callId: $callId) {
      id
      status
    }
  }
`;

const Chat = ({ selectedUser }) => {
  const loggedInUserId = localStorage.getItem('userId');
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);

  const [startVideoCall] = useMutation(START_VIDEO_CALL);
  const [acceptVideoCall] = useMutation(ACCEPT_VIDEO_CALL);
  const [rejectVideoCall] = useMutation(REJECT_VIDEO_CALL);

  const { data: incomingCallData } = useSubscription(INCOMING_VIDEO_CALL, {
    variables: { receiverId: loggedInUserId },
  });

  console.log("incomingCallData: ", incomingCallData)

  const { data: callAcceptedData } = useSubscription(VIDEO_CALL_ACCEPTED, {
    variables: { callId: incomingCall?.id },
    skip: !incomingCall,
  });

  const { data: callRejectedData } = useSubscription(VIDEO_CALL_REJECTED, {
    variables: { callId: incomingCall?.id },
    skip: !incomingCall,
  });

  useEffect(() => {
    if (incomingCallData) {
      setIncomingCall(incomingCallData.incomingVideoCall);
    }
  }, [incomingCallData]);

  const initiateVideoCall = () => {
    startVideoCall({ variables: { receiverId: selectedUser.id } });
  };

  const handleAcceptCall = () => {
    acceptVideoCall({ variables: { callId: incomingCall.id } });
    setIsVideoCall(true);
  };

  const handleRejectCall = () => {
    rejectVideoCall({ variables: { callId: incomingCall.id } });
    setIncomingCall(null);
  };

  return (
    <>
      {/* {selectedUser &&  */}
        <div style={{  left: '18rem', width: '80%', position: 'absolute' }}>
          <h2>Chat with  {selectedUser?.username}</h2>
    
          {incomingCall && !isVideoCall && (
            <div>
              <p>Incoming video call from {selectedUser?.username}</p>
              <button onClick={handleAcceptCall}>Accept</button>
              <button onClick={handleRejectCall}>Reject</button>
            </div>
          )}
    
          {!isVideoCall && (
            <button onClick={initiateVideoCall}>Start Video Call</button>
          )}
    
          {isVideoCall && (
            <VideoChat callId={incomingCall.id} />
          )}
        </div>
      {/* }    */}
    </>
  );
};

export default Chat;
