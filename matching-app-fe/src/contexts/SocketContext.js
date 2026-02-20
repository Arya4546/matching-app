import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Map());
  const [matchRequests, setMatchRequests] = useState([]);
  const [currentMatches, setCurrentMatches] = useState([]);

  useEffect(() => {
    if (isAuthenticated && user) {
      const token = localStorage.getItem('authToken');
      
      const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

      try {
        new URL(socketUrl);
      } catch (error) {
        console.error('Invalid socket URL:', socketUrl);
        return;
      }

      const newSocket = io(socketUrl, {
        auth: { token },
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        setConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setConnected(false);
      });

      newSocket.on('userOnline', (data) => {
        setOnlineUsers(prev => {
          const updated = new Map(prev);
          updated.set(data.userId, {
            id: data.userId,
            name: data.name,
            location: data.location,
            profilePhoto: data.profilePhoto,
            isOnline: true,
            lastSeen: new Date()
          });
          return updated;
        });
      });

      newSocket.on('userOffline', (data) => {
        setOnlineUsers(prev => {
          const updated = new Map(prev);
          if (updated.has(data.userId)) {
            updated.set(data.userId, {
              ...updated.get(data.userId),
              isOnline: false,
              lastSeen: new Date(data.lastSeen)
            });
          }
          return updated;
        });
      });

      newSocket.on('userLocationUpdate', (data) => {
        setOnlineUsers(prev => {
          const updated = new Map(prev);
          if (updated.has(data.userId)) {
            updated.set(data.userId, {
              ...updated.get(data.userId),
              location: data.location,
              lastSeen: new Date()
            });
          }
          return updated;
        });
      });

      newSocket.on('newMatchRequest', (data) => {
        setMatchRequests(prev => [...prev, data]);
        toast.info(`${data.requester.name}から新しいマッチリクエストが届きました`, {
          onClick: () => window.dispatchEvent(new CustomEvent('showMatchRequest', { detail: data }))
        });
      });

      newSocket.on('matchAccepted', (data) => {
        setCurrentMatches(prev => [...prev, data]);
        toast.success(`${data.targetUser.name}があなたのマッチリクエストを承認しました！`, {
          onClick: () => window.dispatchEvent(new CustomEvent('showMatch', { detail: data }))
        });
      });

      newSocket.on('matchRejected', (data) => {
        toast.error('あなたのマッチリクエストは断られました');
      });

      newSocket.on('matchConfirmed', (data) => {
        setCurrentMatches(prev => [...prev, data]);
        toast.success('マッチが確認されました！待ち合わせの詳細が利用できます。', {
          onClick: () => window.dispatchEvent(new CustomEvent('showMatch', { detail: data }))
        });
      });

      newSocket.on('meetingConfirmed', (data) => {
        if (data.bothConfirmed) {
          toast.success('両者とも待ち合わせを確認しました！');
        } else {
          toast.info(`${data.confirmedBy}が待ち合わせを確認しました`);
        }
      });

      newSocket.on('userApproachingMeeting', (data) => {
        toast.info(`${data.userName}が待ち合わせ場所に近づいています`);
      });

      newSocket.on('locationShared', (data) => {
        toast.info(`${data.senderName}があなたと位置情報を共有しました`);
        window.dispatchEvent(new CustomEvent('locationShared', { detail: data }));
      });

      newSocket.on('locationShareExpired', (data) => {
        window.dispatchEvent(new CustomEvent('locationShareExpired', { detail: data }));
      });

      newSocket.on('ping', () => {
        newSocket.emit('pong');
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
        setConnected(false);
        setOnlineUsers(new Map());
        setMatchRequests([]);
        setCurrentMatches([]);
      }
    }
  }, [isAuthenticated, user?.id]);

  const updateLocation = (lat, lng) => {
    if (socket && connected) {
      socket.emit('updateLocation', { lat, lng });
    }
  };

  const joinRoom = (roomId) => {
    if (socket && connected) {
      socket.emit('joinRoom', roomId);
    }
  };

  const leaveRoom = (roomId) => {
    if (socket && connected) {
      socket.emit('leaveRoom', roomId);
    }
  };

  const sendMessage = (roomId, message, targetUserId) => {
    if (socket && connected) {
      socket.emit('sendMessage', { roomId, message, targetUserId });
    }
  };

  const notifyApproachingMeeting = (matchId, targetUserId, distance) => {
    if (socket && connected) {
      socket.emit('approachingMeeting', { matchId, targetUserId, distance });
    }
  };

  const requestLocationShare = (targetUserId) => {
    if (socket && connected) {
      socket.emit('requestLocationShare', targetUserId);
    }
  };

  const shareLocation = (targetUserId, location, duration = 300000) => {
    if (socket && connected) {
      socket.emit('shareLocation', { targetUserId, location, duration });
    }
  };

  const removeMatchRequest = (matchId) => {
    setMatchRequests(prev => prev.filter(req => req.matchId !== matchId));
  };

  const value = {
    socket,
    connected,
    onlineUsers: Array.from(onlineUsers.values()),
    matchRequests,
    currentMatches,
    updateLocation,
    joinRoom,
    leaveRoom,
    sendMessage,
    notifyApproachingMeeting,
    requestLocationShare,
    shareLocation,
    removeMatchRequest
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};