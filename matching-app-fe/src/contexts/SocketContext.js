import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { toast } from 'react-toastify';
import { matchingAPI } from '../services/api';
import { useAuth } from './AuthContext';

const SocketContext = createContext();
const MAX_PENDING_LIFECYCLE_EVENTS = 20;

const upsertRequestByMatchId = (previous, nextRequest) => {
  if (!nextRequest?.matchId) {
    return previous;
  }

  const existingIndex = previous.findIndex((item) => item.matchId === nextRequest.matchId);
  if (existingIndex === -1) {
    return [nextRequest, ...previous];
  }

  return previous.map((item) =>
    item.matchId === nextRequest.matchId ? { ...item, ...nextRequest } : item
  );
};

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
  const [outgoingMatchRequests, setOutgoingMatchRequests] = useState([]);
  const [pendingLifecycleEvents, setPendingLifecycleEvents] = useState([]);
  const [currentMatches, setCurrentMatches] = useState([]);

  const pushPendingLifecycleEvent = useCallback((event) => {
    if (!event?.matchId) {
      return;
    }

    const normalizedEvent = {
      matchId: event.matchId,
      status: event.status || 'resolved',
      resolvedAt: event.resolvedAt || new Date().toISOString(),
      meetingReason: event.meetingReason,
      urgency: event.urgency,
      otherUserName:
        event.otherUserName ||
        event.targetUser?.name ||
        event.requester?.name ||
        null
    };

    setPendingLifecycleEvents((previous) => [normalizedEvent, ...previous].slice(0, MAX_PENDING_LIFECYCLE_EVENTS));
  }, []);

  const refreshPendingRequests = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    try {
      const response = await matchingAPI.getPendingSummary();
      setMatchRequests(Array.isArray(response.data?.incoming) ? response.data.incoming : []);
      setOutgoingMatchRequests(Array.isArray(response.data?.outgoing) ? response.data.outgoing : []);
    } catch (error) {
      console.error('Failed to hydrate pending request summary:', error);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      const token = localStorage.getItem('authToken');
      const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

      try {
        new URL(socketUrl);
      } catch (error) {
        console.error('Invalid socket URL:', socketUrl);
        return undefined;
      }

      const newSocket = io(socketUrl, {
        auth: { token },
        transports: ['websocket', 'polling']
      });

      refreshPendingRequests();

      newSocket.on('connect', () => {
        setConnected(true);
      });

      newSocket.on('disconnect', () => {
        setConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setConnected(false);
      });

      newSocket.on('userOnline', (data) => {
        setOnlineUsers((previous) => {
          const updated = new Map(previous);
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
        setOnlineUsers((previous) => {
          const updated = new Map(previous);
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
        setOnlineUsers((previous) => {
          const updated = new Map(previous);
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
        setMatchRequests((previous) => upsertRequestByMatchId(previous, data));
        const requesterName = data?.requester?.name || 'A user';
        toast.info(`${requesterName} sent you a meeting request.`, {
          onClick: () => window.dispatchEvent(new CustomEvent('showMatchRequest', { detail: data }))
        });
      });

      newSocket.on('outgoingMatchPending', (data) => {
        setOutgoingMatchRequests((previous) => upsertRequestByMatchId(previous, data));
      });

      newSocket.on('matchAccepted', (data) => {
        setCurrentMatches((previous) => [...previous, data]);
        setOutgoingMatchRequests((previous) =>
          previous.filter((requestItem) => requestItem.matchId !== data.matchId)
        );
        pushPendingLifecycleEvent({
          ...data,
          status: 'accepted',
          otherUserName: data?.targetUser?.name
        });

        const targetName = data?.targetUser?.name || 'The user';
        toast.success(`${targetName} accepted your meeting request.`, {
          onClick: () => window.dispatchEvent(new CustomEvent('showMatch', { detail: data }))
        });
      });

      newSocket.on('matchRejected', (data) => {
        setOutgoingMatchRequests((previous) =>
          previous.filter((requestItem) => requestItem.matchId !== data.matchId)
        );
        pushPendingLifecycleEvent({
          ...data,
          status: 'rejected'
        });
        toast.info('Your meeting request was declined.');
      });

      newSocket.on('incomingMatchResolved', (data) => {
        setMatchRequests((previous) =>
          previous.filter((requestItem) => requestItem.matchId !== data.matchId)
        );
        pushPendingLifecycleEvent(data);
      });

      newSocket.on('matchConfirmed', (data) => {
        setCurrentMatches((previous) => [...previous, data]);
        setMatchRequests((previous) =>
          previous.filter((requestItem) => requestItem.matchId !== data.matchId)
        );
        toast.success('Match confirmed. Meeting details are now available.', {
          onClick: () => window.dispatchEvent(new CustomEvent('showMatch', { detail: data }))
        });
      });

      newSocket.on('meetingConfirmed', (data) => {
        if (data.bothConfirmed) {
          toast.success('Both users confirmed the meeting.');
        } else {
          toast.info(`${data.confirmedBy} confirmed the meeting.`);
        }
      });

      newSocket.on('userApproachingMeeting', (data) => {
        toast.info(`${data.userName} is approaching the meeting point.`);
      });

      newSocket.on('locationShared', (data) => {
        toast.info(`${data.senderName} shared their location with you.`);
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
    }

    setSocket((existingSocket) => {
      if (existingSocket) {
        existingSocket.close();
      }
      return null;
    });
    setConnected(false);
    setOnlineUsers(new Map());
    setMatchRequests([]);
    setOutgoingMatchRequests([]);
    setPendingLifecycleEvents([]);
    setCurrentMatches([]);
    return undefined;
  }, [isAuthenticated, pushPendingLifecycleEvent, refreshPendingRequests, user?.id]);

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
    setMatchRequests((previous) => previous.filter((requestItem) => requestItem.matchId !== matchId));
  };

  const removeOutgoingMatchRequest = (matchId) => {
    setOutgoingMatchRequests((previous) =>
      previous.filter((requestItem) => requestItem.matchId !== matchId)
    );
  };

  const value = {
    socket,
    connected,
    onlineUsers: Array.from(onlineUsers.values()),
    matchRequests,
    outgoingMatchRequests,
    pendingLifecycleEvents,
    currentMatches,
    updateLocation,
    joinRoom,
    leaveRoom,
    sendMessage,
    notifyApproachingMeeting,
    requestLocationShare,
    shareLocation,
    removeMatchRequest,
    removeOutgoingMatchRequest,
    refreshPendingRequests
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
