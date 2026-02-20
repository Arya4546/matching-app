import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { userAPI } from '../services/api';
import { toast } from 'react-toastify';

const LocationContext = createContext();

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

export const LocationProvider = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState(null);
  const [watchId, setWatchId] = useState(null);
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const requestLocationPermission = useCallback(async () => {
    if (!navigator.geolocation) {
      toast.error('このブラウザではジオロケーションがサポートされていません');
      // Use fallback location (San Francisco)
      const fallbackLocation = {
        lat: 40.7749,
        lng: -74.4194,
        accuracy: 1000
      };
      setCurrentLocation(fallbackLocation);
      setLocationPermission('fallback');
      return true;
    }

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000, // Reduced timeout
          maximumAge: 300000
        });
      });

      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy
      };

      setCurrentLocation(location);
      setLocationPermission('granted');

      await updateLocationOnServer(location.lat, location.lng);
      return true;
    } catch (error) {
      console.error('Location permission error:', error);
      setLocationPermission('denied');

      // Use fallback location when permission is denied or timeout occurs
      const fallbackLocation = {
        lat: 40.7749, // San Francisco coordinates
        lng: -74.4194,
        accuracy: 1000
      };
      setCurrentLocation(fallbackLocation);

      if (error.code === 1) {
        toast.warning('位置情報の許可が拒否されました。デフォルトの位置を使用します。より良い体験のために許可してください。');
      } else if (error.code === 2) {
        toast.warning('位置情報が利用できません。デフォルトの位置を使用します。');
      } else {
        toast.warning('位置情報の取得がタイムアウトしました。デフォルトの位置を使用します。');
      }

      return true; // Return true so map can still display
    }
  }, []);

  const startLocationTracking = () => {
    if (!navigator.geolocation || locationPermission !== 'granted') {
      return;
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        };

        setCurrentLocation(prevLocation => {
          if (!prevLocation ||
            Math.abs(prevLocation.lat - location.lat) > 0.0001 ||
            Math.abs(prevLocation.lng - location.lng) > 0.0001) {
            updateLocationOnServer(location.lat, location.lng);
            return location;
          }
          return prevLocation;
        });
      },
      (error) => {
        console.error('Location tracking error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 60000
      }
    );

    setWatchId(id);
  };

  const stopLocationTracking = () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  };

  const updateLocationOnServer = async (lat, lng) => {
    try {
      await userAPI.updateLocation(lat, lng);
    } catch (error) {
      console.error('Failed to update location on server:', error);
    }
  };

  const getAllUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await userAPI.getAllUsers();
      const users = response.data?.users || [];
      setNearbyUsers(users);
      // toast.success(`Loaded ${users.length} users`);
      return users;
    } catch (error) {
      console.error('Error fetching all users:', error);
      toast.error('ユーザーの読み込みに失敗しました');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getNearbyUsers = async (radius = 100000) => {
    if (!currentLocation) {
      toast.error('位置情報が利用できません');
      return;
    }
    try {
      setLoading(true);
      const response = await userAPI.getNearbyUsers(
        currentLocation.lat,
        currentLocation.lng,
        radius
      );
      setNearbyUsers(response.data.users);
      // toast.success(`Loaded ${response.data.users.length} users`); 
      return response.data.users;
    } catch (error) {
      console.error('Error fetching nearby users:', error);
      toast.error('近くのユーザーの読み込みに失敗しました');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const seedUsers = async () => {
    try {
      setLoading(true);
      const response = await userAPI.seedUsers();
      toast.success('テストユーザーが正常に作成されました！');
      return response.data;
    } catch (error) {
      console.error('Error seeding users:', error);
      toast.error('テストユーザーの作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const getDirections = (destination) => {
    if (!currentLocation || !destination) {
      return null;
    }

    const distance = calculateDistance(
      currentLocation.lat,
      currentLocation.lng,
      destination.lat,
      destination.lng
    );
    console.log(currentLocation)
    const walkingTime = Math.ceil(distance / 83.33);

    return {
      distance: Math.round(distance),
      walkingTime,
      origin: currentLocation,
      destination
    };
  };

  useEffect(() => {
    if (locationPermission === 'granted' && navigator.geolocation) {
      const id = navigator.geolocation.watchPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          };

          setCurrentLocation(prevLocation => {
            if (!prevLocation ||
              Math.abs(prevLocation.lat - location.lat) > 0.0001 ||
              Math.abs(prevLocation.lng - location.lng) > 0.0001) {
              updateLocationOnServer(location.lat, location.lng);
              return location;
            }
            return prevLocation;
          });
        },
        (error) => {
          console.error('Location tracking error:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 60000
        }
      );

      setWatchId(id);

      return () => {
        if (id) {
          navigator.geolocation.clearWatch(id);
        }
      };
    }
  }, [locationPermission]);

  const value = {
    currentLocation,
    locationPermission,
    nearbyUsers,
    loading,
    requestLocationPermission,
    startLocationTracking,
    stopLocationTracking,
    getAllUsers,
    getNearbyUsers,
    seedUsers,
    calculateDistance,
    getDirections,
    updateLocationOnServer
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};