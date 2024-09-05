import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gql, useQuery } from '@apollo/client';
import Chat from './VChat';

const GET_USERS = gql`
  query GetUsers {
    users {
      id
      username
    }
  }
`;

const Users = () => {
  const navigate = useNavigate()
  const [selectedUser, setSelectedUser] = useState(null);
  const username = localStorage.getItem('username');

  const { loading, error, data } = useQuery(GET_USERS);


  const selectFriend = (user) => {
    setSelectedUser(user)
    navigate(`?userId=${user.id.toString()}&username=${user.username}`);
  }

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error fetching users: {error.message}</p>;

  return (
    <div style={{ width: '100%',}}>
      <div style={{ display: 'flex', position: 'relative' }}>
      
       <div style={{ width: '150px', position: 'fixed' }}>
        <h1>Friends</h1>
       {data.users.map((user, key) => (
         <>
          {username != user.username &&
            <button 
            style={{
              fontSize: '21px',
              border: '1px solid #dcf8c6',
              background: '#dcf8c6',
              // padding: '4px 10px',
              paddingRight: '99px',
              borderRadius: '4px',
              color: 'black',
              alignItems: 'left',
              width: '237px'
            }}
            key={key} 
            onClick={() => selectFriend(user)}
            
            >{user.username}</button>
          }
         </>
        ))}
       </div>
      
      <Chat selectedUser={selectedUser} />
      </div>
     
    </div>
  );
};

export default Users;
