import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useSubscription, gql } from '@apollo/client';
import { useLocation } from 'react-router-dom';

const GET_MESSAGES = gql`
  query GetMessages($senderId: ID!, $receiverId: ID!) {
    messagesBetween(senderId: $senderId, receiverId: $receiverId) {
      id
      content
      sender {
        id
        username
      }
      receiver {
        id
        username
      }
      createdAt
    }
  }
`;

const SEND_MESSAGE = gql`
  mutation SendMessage($senderId: ID!, $receiverId: ID!, $content: String!) {
    sendMessage(senderId: $senderId, receiverId: $receiverId, content: $content) {
      id
      content
      sender {
        id
        username
      }
      receiver {
        id
        username
      }
      createdAt
    }
  }
`;

const MESSAGE_SENT_SUBSCRIPTION = gql`
  subscription OnMessageSent($receiverId: ID!) {
    messageSent(receiverId: $receiverId) {
      id
      content
      sender {
        id
        username
      }
      receiver {
        id
        username
      }
      createdAt
    }
  }
`;

const Chat = ({ }) => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const endOfMessagesRef = useRef(null);
  const selectedUserId = queryParams.get('userId');
  const selectedUserName = queryParams.get('username');

  const [messages, setMessages] = useState([]);
  const [messageContent, setMessageContent] = useState('');

  const loggedInUserId = localStorage.getItem('userId');

  const { loading, data, refetch } = useQuery(GET_MESSAGES, {
    variables: { senderId: loggedInUserId, receiverId: selectedUserId },
    skip: !selectedUserId,
  });

  const [sendMessage] = useMutation(SEND_MESSAGE);

  const { data: subscriptionData, loading: subLoading, error } = useSubscription(MESSAGE_SENT_SUBSCRIPTION, {
    variables: { receiverId: loggedInUserId },
  });


  useEffect(() => {
    if (data && data.messagesBetween) {
      setMessages(data.messagesBetween);
    }
  }, [data]);

  console.log("subscriptionData", subscriptionData)

  useEffect(() => {
    if (subscriptionData) {
      setMessages((prevMessages) => [...prevMessages, subscriptionData.messageSent]);
    }
  }, [subscriptionData, subLoading]);

  console.log("selectedUserId", selectedUserId)

  useEffect(() => {
    if (selectedUserId) {
      refetch();
    }
  }, [selectedUserId, refetch]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  const handleSendMessage = () => {
    sendMessage({
      variables: {
        senderId: loggedInUserId,
        receiverId: selectedUserId,
        content: messageContent,
      },
    });
    setMessageContent(''); // Clear input after sending
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent newline insertion
      handleSendMessage();
    }
  };

  if (loading) return <p>Loading chat history...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <>
      {selectedUserId &&
        <div>
          <div style={{  left: '18rem', width: '80%', position: 'absolute' }}>
            <h2 style={{ margin: '10px', padding: '10px' }}>Chat with {selectedUserName}</h2>
            <div className="chat-history">
              {messages.map((message) => (
                <div key={message.id} className={message.sender.id === loggedInUserId ? 'sent' : 'received'}>
                  <p>{message.content}</p>
                  {/* <small>{message.createdAt}</small> */}
                  <small>{new Date(Number(message.createdAt)).toLocaleString()}</small>
                </div>
              ))}
              <div ref={endOfMessagesRef} />
            </div>
            <div className="chat-input">
              <input
                type="text"
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                onKeyDown={handleKeyDown} 
                placeholder="Type a message..."
              />
              <button onClick={handleSendMessage}>Send</button>
            </div>
          </div>
        </div>
      }
    </>
  );
};

export default Chat;