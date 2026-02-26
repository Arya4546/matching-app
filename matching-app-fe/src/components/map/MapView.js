import { HiUserGroup } from "react-icons/hi";
import { RiUserHeartFill } from "react-icons/ri";
import { HiUsers } from "react-icons/hi";
import { FaListUl } from "react-icons/fa";
import { BiListUl } from "react-icons/bi";
import { CgPlayList } from "react-icons/cg";
import { IoSearch, IoOptionsOutline } from "react-icons/io5";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import { useLocation } from "../../contexts/LocationContext";
import { useSocket } from "../../contexts/SocketContext";
import GoogleMapsService from "../../services/googleMaps";
import UserPanel from "./UserPanel";
import MatchRequestModal from "../matching/MatchRequestModal";
import MatchResponseModal from "../matching/MatchResponseModal";
import MeetingModal from "../matching/MeetingModal";
import ProfileModal from "../profile/ProfileModal";
import UserSelectionModal from "../matching/UserSelectionModal";
import "../../styles/MapView.css";

const MapView = () => {
  const mapRef = useRef(null);
  const loadingUsersRef = useRef(false);
  const { user, logout } = useAuth();
  const {
    currentLocation,
    getNearbyUsers,
    getAllUsers,
    nearbyUsers,
    seedUsers,
    loading,
    calculateDistance,
  } = useLocation();
  const { connected, onlineUsers, matchRequests, updateLocation } = useSocket();

  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showMatchRequest, setShowMatchRequest] = useState(false);
  const [showMatchResponse, setShowMatchResponse] = useState(null);
  const [showMeeting, setShowMeeting] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showUserSelection, setShowUserSelection] = useState(false);
  const [selectedUserForModal, setSelectedUserForModal] = useState(null);
  const [userPanelExpanded, setUserPanelExpanded] = useState(false);
  const [usersWithinRadius, setUsersWithinRadius] = useState([]);
  const [radiusUserCount, setRadiusUserCount] = useState(0);
  const [hasSearchedNearbyUsers, setHasSearchedNearbyUsers] = useState(false);
  const [alternatingMarkers, setAlternatingMarkers] = useState([]);
  const alternationTimerRef = useRef(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshComplete, setRefreshComplete] = useState(false);
  const originalMapState = useRef(null);
  const [isRealtimeListHidden, setIsRealtimeListHidden] = useState(false);

  // Define loadAllUsers first to avoid dependency issues
  const loadAllUsers = useCallback(async () => {
    if (loadingUsersRef.current) {
      return; // Prevent multiple simultaneous calls
    }
    try {
      loadingUsersRef.current = true;
      await getAllUsers();
      // The users are automatically stored in nearbyUsers by getAllUsers function
    } catch (error) {
      console.error("Failed to load all users:", error);
    } finally {
      loadingUsersRef.current = false;
    }
  }, [getAllUsers]);

  // Define updateMapMarkers
  const updateMapMarkers = useCallback(() => {
    // Use usersWithinRadius if available (from search), otherwise use nearbyUsers
    const usersToDisplay =
      usersWithinRadius.length > 0 ? usersWithinRadius : nearbyUsers;

    console.log("updateMapMarkers called with:", {
      usersWithinRadius: usersWithinRadius.length,
      nearbyUsers: nearbyUsers.length,
      usersToDisplay: usersToDisplay.length,
    });

    usersToDisplay.forEach((user) => {
      if (user.location && user.location.coordinates) {
        console.log(
          `Creating/updating marker for user: ${user.name || user.id}`
        );
        const existingMarker = GoogleMapsService.markers.get(
          user.id || user._id
        );
        if (existingMarker) {
          GoogleMapsService.updateUserMarker(
            user.id || user._id,
            user.location,
            user
          );
        } else {
          GoogleMapsService.createUserMarker(user);
        }
      } else {
        console.log(
          `User ${user.name || user.id} has no valid location data:`,
          user.location
        );
      }
    });
  }, [nearbyUsers, usersWithinRadius]);

  useEffect(() => {
    const initializeMap = async () => {
      try {
        await GoogleMapsService.initialize();

        console.log(currentLocation.lng, "=========", currentLocation.lat);
        if (mapRef.current && currentLocation) {
          GoogleMapsService.createMap(mapRef.current, {
            center: { lat: currentLocation.lat, lng: currentLocation.lng },
            zoom: 8, // Start with 100km view
          });
          // Create marker for current user with distinct styling
          GoogleMapsService.createUserMarker(
            {
              id: user.id,
              name: "You",
              location: {
                coordinates: [currentLocation.lng, currentLocation.lat],
              },
              gender: user.gender,
              address: user.address,
              phoneNumber: user.phoneNumber,
              profilePhoto: user.profilePhoto,
              bio: user.bio,
              matchCount: user.matchCount,
              actualMeetCount: user.actualMeetCount,
              isCurrentUser: true,
            },
            true
          );

          setMapLoaded(true);

          // Save initial map state after a short delay to ensure map is fully rendered
          setTimeout(() => {
            if (window.googleMapsService && window.googleMapsService.map) {
              const map = window.googleMapsService.map;
              originalMapState.current = {
                center: map.getCenter(),
                zoom: map.getZoom(),
                bounds: map.getBounds()
              };
              console.log('💾 Saved original map state:', originalMapState.current);
            }
          }, 500);
        }
      } catch (error) {
        console.error("Failed to initialize map:", error);
      }
    };

    if (currentLocation && user) {
      initializeMap();
    }
  }, [currentLocation, user]);

  // Handle map centering when user selection changes
  useEffect(() => {
    if (!mapLoaded || !currentLocation) {
      console.log('🔄 Map centering useEffect: map not loaded or no current location');
      return;
    }

    console.log('🔄 Map centering useEffect triggered:', {
      showUserSelection,
      selectedUserForModal: !!selectedUserForModal,
      currentLocation
    });

    if (showUserSelection && selectedUserForModal && selectedUserForModal.location) {
      // User selected and modal displayed - show both users
      const selectedUserLocation = {
        lat: selectedUserForModal.location.coordinates[1],
        lng: selectedUserForModal.location.coordinates[0]
      };

      GoogleMapsService.setMapToShowTwoUsers(currentLocation, selectedUserLocation);
      GoogleMapsService.showExclamationMark(selectedUserLocation);
      console.log('✅ Map centered on both users:', currentLocation, selectedUserLocation);
    } else if (!showUserSelection && !selectedUserForModal) {
      // Modal is closed - hide exclamation mark and check if we should restore to original state
      GoogleMapsService.hideExclamationMark();

      // Only do this if the modal is not currently restoring (to avoid conflicts)
      const isModalRestoring = document.querySelector('.user-selection-modal')?.getAttribute('data-restoring') === 'true';

      if (!isModalRestoring) {
        // Modal is not restoring, so we can safely restore to original state
        if (originalMapState.current) {
          const map = window.googleMapsService.map;
          const { center, zoom, bounds } = originalMapState.current;

          console.log('🔄 MapView restoring to original state:', originalMapState.current);

          if (center && zoom) {
            map.setCenter(center);
            map.setZoom(zoom);
            console.log('✅ MapView restored original center and zoom');
          }

          if (bounds && !bounds.isEmpty()) {
            setTimeout(() => {
              map.fitBounds(bounds);
              console.log('✅ MapView restored original bounds');
            }, 200);
          }
        }
      } else {
        console.log('⚠️ MapView useEffect: Modal is restoring, skipping to avoid conflict');
      }
    }
  }, [mapLoaded, currentLocation, showUserSelection, selectedUserForModal]);

  // Load users within 100km radius
  const loadUsersWithinRadius = useCallback(async () => {
    if (!currentLocation) {
      console.log("No current location available for loading users");
      return;
    }

    try {
      console.log("Loading users within 100km of:", currentLocation);
      const users = await getNearbyUsers(100000); // 100km in meters
      console.log("Raw users from API:", users);

      // Filter out users with 0m distance
      const filteredUsers =
        users?.filter((user) => {
          if (user.location && user.location.coordinates && currentLocation) {
            const distance = calculateDistance(
              currentLocation.lat,
              currentLocation.lng,
              user.location.coordinates[1],
              user.location.coordinates[0]
            );
            console.log(
              `User ${user.name || user.id}: distance = ${distance}m`
            );
            return distance > 0; // Filter out users with 0m distance
          }
          return true;
        }) || [];

      console.log("Filtered users:", filteredUsers);
      setUsersWithinRadius(filteredUsers);
      setRadiusUserCount(filteredUsers.length);
      return filteredUsers;
    } catch (error) {
      console.error("Failed to load users within radius:", error);
      setUsersWithinRadius([]);
      setRadiusUserCount(0);
    }
  }, [currentLocation, getNearbyUsers, calculateDistance]);

  // Stop marker alternation timer
  const stopMarkerAlternation = useCallback(() => {
    if (alternationTimerRef.current) {
      clearInterval(alternationTimerRef.current);
      alternationTimerRef.current = null;
    }
  }, []);

  // Start marker alternation timer
  const startMarkerAlternation = useCallback(
    (pairs) => {
      stopMarkerAlternation(); // Clear any existing timer

      let isFirstMarker = true;

      alternationTimerRef.current = setInterval(() => {
        pairs.forEach((pair) => {
          const marker1 = GoogleMapsService.markers.get(
            pair.user1.id || pair.user1._id
          );
          const marker2 = GoogleMapsService.markers.get(
            pair.user2.id || pair.user2._id
          );

          if (marker1 && marker2) {
            if (isFirstMarker) {
              marker1.setZIndex(1000);
              marker2.setZIndex(100);
            } else {
              marker1.setZIndex(100);
              marker2.setZIndex(1000);
            }
          }
        });

        isFirstMarker = !isFirstMarker;
      }, 1000); // Change every 1 second
    },
    [stopMarkerAlternation]
  );

  // Function to detect nearby markers and start alternation
  const detectAndAlternateNearbyMarkers = useCallback(
    (users) => {
      if (!currentLocation || !users || users.length < 2) return;

      const nearbyPairs = [];
      const proximityThreshold = 1000; // 1km in meters

      // Find pairs of users that are very close to each other
      for (let i = 0; i < users.length; i++) {
        for (let j = i + 1; j < users.length; j++) {
          const user1 = users[i];
          const user2 = users[j];

          if (
            user1.location &&
            user1.location.coordinates &&
            user2.location &&
            user2.location.coordinates
          ) {
            const distance = calculateDistance(
              user1.location.coordinates[1],
              user1.location.coordinates[0],
              user2.location.coordinates[1],
              user2.location.coordinates[0]
            );

            if (distance < proximityThreshold) {
              nearbyPairs.push({
                user1: user1,
                user2: user2,
                distance: distance,
              });
            }
          }
        }
      }

      if (nearbyPairs.length > 0) {
        console.log("Found nearby marker pairs:", nearbyPairs);
        setAlternatingMarkers(nearbyPairs);
        startMarkerAlternation(nearbyPairs);
      } else {
        setAlternatingMarkers([]);
        stopMarkerAlternation();
      }
    },
    [
      currentLocation,
      calculateDistance,
      startMarkerAlternation,
      stopMarkerAlternation,
    ]
  );

  // Load users when component mounts
  useEffect(() => {
    if (user && !loading) {
      loadAllUsers();
    }
  }, [user]); // Remove loadAllUsers and loading from dependencies to prevent infinite loop

  // Automatically load users within 100km when map is loaded and user is available
  useEffect(() => {
    if (mapLoaded && user && currentLocation && !hasSearchedNearbyUsers) {
      loadUsersWithinRadius();
      setHasSearchedNearbyUsers(true);
    }
  }, [mapLoaded, user, currentLocation, hasSearchedNearbyUsers, loadUsersWithinRadius]);

  // Automatically display users within radius when they're loaded
  // Skip while a user profile/selection is shown to keep focused zoom stable
  useEffect(() => {
    if (showUserSelection || showProfile) return;
    if (mapLoaded && usersWithinRadius.length > 0 && hasSearchedNearbyUsers) {
      // Clear existing user markers except current user
      GoogleMapsService.clearAllUserMarkers();

      // Create markers for users within 100km radius
      usersWithinRadius.forEach((user) => {
        if (user.location && user.location.coordinates) {
          GoogleMapsService.createUserMarker(user, false, true); // isWithinRadius = true
        }
      });

      // Fit map to show all users within radius
      GoogleMapsService.fitMapToShowAllUsers(usersWithinRadius, currentLocation);

      // Update original map state after fitting to show all users
      if (window.googleMapsService && window.googleMapsService.map) {
        const map = window.googleMapsService.map;
        setTimeout(() => {
          originalMapState.current = {
            center: map.getCenter(),
            zoom: map.getZoom(),
            bounds: map.getBounds()
          };
        }, 500); // Wait for fitBounds to complete
      }

      // Ensure current location marker is visible
      if (currentLocation && user) {
        GoogleMapsService.createUserMarker(
          {
            id: "current-user",
            name: "You",
            location: {
              coordinates: [currentLocation.lng, currentLocation.lat],
            },
            gender: user.gender,
            address: user.address,
            phoneNumber: user.phoneNumber,
            profilePhoto: user.profilePhoto,
            bio: user.bio,
            matchCount: user.matchCount,
            actualMeetCount: user.actualMeetCount,
            isCurrentUser: true,
          },
          true
        );
      }
    }
  }, [mapLoaded, usersWithinRadius, hasSearchedNearbyUsers, currentLocation, user, showUserSelection, showProfile]);

  // Cleanup timer on component unmount
  useEffect(() => {
    return () => {
      stopMarkerAlternation();
    };
  }, [stopMarkerAlternation]);

  useEffect(() => {
    if (mapLoaded && currentLocation) {
      updateLocation(currentLocation.lat, currentLocation.lng);
    }
  }, [currentLocation, mapLoaded, updateLocation]);

  useEffect(() => {
    if (mapLoaded) {
      updateMapMarkers();
    }
  }, [mapLoaded, updateMapMarkers, usersWithinRadius]);

  // Separate effect to handle marker alternation after markers are updated
  useEffect(() => {
    if (mapLoaded) {
      const usersToDisplay =
        usersWithinRadius.length > 0 ? usersWithinRadius : nearbyUsers;
      if (usersToDisplay.length > 0) {
        setTimeout(() => {
          detectAndAlternateNearbyMarkers(usersToDisplay);
        }, 200); // Delay to ensure markers are created
      }
    }
  }, [
    mapLoaded,
    usersWithinRadius,
    nearbyUsers,
    detectAndAlternateNearbyMarkers,
  ]);

  // Periodically refresh nearby list for a "realtime" feel
  useEffect(() => {
    if (!mapLoaded || !currentLocation) return;
    const id = setInterval(() => {
      loadUsersWithinRadius();
    }, 15000);
    return () => clearInterval(id);
  }, [mapLoaded, currentLocation, loadUsersWithinRadius]);

  useEffect(() => {
    const handleMatchRequest = (event) => {
      const { userId, name } = event.detail;
      // Find the full user object from nearbyUsers
      const fullUser = nearbyUsers.find((u) => (u.id || u._id) === userId);
      if (fullUser) {
        setSelectedUser(fullUser);
      } else {
        setSelectedUser({ id: userId, name });
      }
      setShowMatchRequest(true);
    };

    const handleMatchRequestWithData = (event) => {
      // This event comes with full user data from map marker click
      setSelectedUser(event.detail);
      setShowMatchRequest(true);
    };

    const handleShowMatchRequest = (event) => {
      setShowMatchResponse(event.detail);
    };

    const handleShowMatch = (event) => {
      setShowMeeting(event.detail);
    };

    const handleShowUserSelection = (event) => {
      const selectedUser = event.detail;
      setSelectedUserForModal(selectedUser);
      setShowUserSelection(true);

      // Center map on both current user and selected user
      if (currentLocation && selectedUser && selectedUser.location) {
        const currentUserLocation = {
          lat: currentLocation.lat,
          lng: currentLocation.lng
        };
        const selectedUserLocation = {
          lat: selectedUser.location.coordinates[1],
          lng: selectedUser.location.coordinates[0]
        };

        GoogleMapsService.setMapToShowTwoUsers(currentUserLocation, selectedUserLocation);
      }
    };

    const handleShowLocationOnMap = (event) => {
      const { location, name, address } = event.detail;
      // Center map on the selected location
      GoogleMapsService.centerOnLocation(location, 16);

      // Create a temporary marker for the selected location
      GoogleMapsService.createMarker(location, {
        title: name,
        icon: {
          url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#f54d6a" stroke="white" stroke-width="2"/>
              <circle cx="12" cy="9" r="3" fill="white"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(24, 24),
          anchor: new window.google.maps.Point(12, 24),
        }
      });
    };

    window.addEventListener("requestMatch", handleMatchRequest);
    window.addEventListener("requestMatchWithData", handleMatchRequestWithData);
    window.addEventListener("showMatchRequest", handleShowMatchRequest);
    window.addEventListener("showMatch", handleShowMatch);
    window.addEventListener("showUserSelectionModal", handleShowUserSelection);
    window.addEventListener("showLocationOnMap", handleShowLocationOnMap);

    return () => {
      window.removeEventListener("requestMatch", handleMatchRequest);
      window.removeEventListener(
        "requestMatchWithData",
        handleMatchRequestWithData
      );
      window.removeEventListener("showMatchRequest", handleShowMatchRequest);
      window.removeEventListener("showMatch", handleShowMatch);
      window.removeEventListener("showUserSelectionModal", handleShowUserSelection);
      window.removeEventListener("showLocationOnMap", handleShowLocationOnMap);
    };
  }, [nearbyUsers]);

  const loadNearbyUsers = async () => {
    try {
      await getNearbyUsers(10000);
    } catch (error) {
      console.error("Failed to load nearby users:", error);
    }
  };

  const handleSeedUsers = async () => {
    await seedUsers();
    // After seeding, load all users to show them on the map
    setTimeout(() => {
      loadAllUsers();
    }, 1000);
  };

  const handleLocationRefresh = async () => {
    if (currentLocation && !isRefreshing) {
      setIsRefreshing(true);
      setRefreshComplete(false);

      try {
        GoogleMapsService.centerOnLocation(
          {
            lat: currentLocation.lat,
            lng: currentLocation.lng,
          },
          15
        );
        await loadAllUsers();
        await loadNearbyUsers();

        // Show completion state briefly
        setRefreshComplete(true);
        setTimeout(() => {
          setRefreshComplete(false);
        }, 1000);
      } catch (error) {
        console.error("Refresh failed:", error);
      } finally {
        // Return to default state after showing completion
        setTimeout(() => {
          setIsRefreshing(false);
        }, 800);
      }
    }
  };

  const handleMatchRequestClose = () => {
    setShowMatchRequest(false);
    setSelectedUser(null);
  };

  const handleMatchResponseClose = () => {
    setShowMatchResponse(null);
  };

  const handleMeetingClose = () => {
    setShowMeeting(null);
  };

  const toggleUserPanel = async () => {
    if (!userPanelExpanded) {
      // When opening the panel, refresh users within 100km
      const users = await loadUsersWithinRadius();

      // Mark that we have searched for nearby users
      if (!hasSearchedNearbyUsers) {
        setHasSearchedNearbyUsers(true);
      }

      // Clear all existing markers except current user
      GoogleMapsService.clearAllUserMarkers();
      stopMarkerAlternation(); // Stop any existing alternation

      // Create markers for users within 100km radius (already filtered in loadUsersWithinRadius)
      if (users && users.length > 0) {
        users.forEach((user) => {
          if (user.location && user.location.coordinates) {
            GoogleMapsService.createUserMarker(user, false, true); // isWithinRadius = true
          }
        });

        // Fit map to show all users within radius
        GoogleMapsService.fitMapToShowAllUsers(users, currentLocation);
      }

      // Ensure current location marker is visible
      if (currentLocation && user) {
        GoogleMapsService.createUserMarker(
          {
            id: "current-user",
            name: `You`,
            location: {
              coordinates: [currentLocation.lng, currentLocation.lat],
            },
            gender: user.gender,
            address: user.address,
            phoneNumber: user.phoneNumber,
            profilePhoto: user.profilePhoto,
            bio: user.bio,
            matchCount: user.matchCount,
            actualMeetCount: user.actualMeetCount,
            isCurrentUser: true,
          },
          true
        );
      }
    } else {
      // When closing the panel, clear all user markers except current user
      GoogleMapsService.clearAllUserMarkers();
      stopMarkerAlternation(); // Stop alternation when closing panel

      // Re-center on current location
      if (currentLocation) {
        GoogleMapsService.centerOnLocation(
          {
            lat: currentLocation.lat,
            lng: currentLocation.lng,
          },
          15
        );
      }
    }
    setUserPanelExpanded(!userPanelExpanded);
  };

  const handleUserSelectionSubmit = (data) => {
    console.log('User selection submitted:', data);
    // Here you can add logic to handle the meeting request
    // For now, just close the modal
    setShowUserSelection(false);
    setSelectedUserForModal(null);
  };

  const handleUserSelectionCancel = () => {
    setShowUserSelection(false);
    setSelectedUserForModal(null);
  };

  if (!currentLocation) {
    return (
      <div className="map-loading">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <h3>位置情報を取得中...</h3>
          <p>継続するには位置アクセスを許可してください</p>
        </div>
      </div>
    );
  }

  // Derived: users to show in realtime list (prefer within 100km)
  const realtimeUsers = usersWithinRadius.length > 0 ? usersWithinRadius : nearbyUsers;
  const currentUserEntry = (user && currentLocation)
    ? {
      id: user.id || "current-user",
      _id: user._id,
      name: user.name || "You",
      profilePhoto: user.profilePhoto,
      location: { coordinates: [currentLocation.lng, currentLocation.lat] },
      gender: user.gender,
      address: user.address,
      phoneNumber: user.phoneNumber,
      bio: user.bio,
      matchCount: user.matchCount,
      actualMeetCount: user.actualMeetCount,
      isCurrentUser: true,
    }
    : null;
  const realtimeUsersWithSelf = currentUserEntry
    ? [currentUserEntry, ...realtimeUsers]
    : realtimeUsers;

  // Check if it's desktop/PC view
  const isDesktop = typeof window !== 'undefined' ? window.innerWidth >= 1024 : false;

  return (
    <div className="map-container">
      <AnimatePresence>
        {(!showUserSelection || isDesktop) && (
          <motion.div
            className="map-header"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="header-left">
              <motion.button
                className="menu-btn"
                onClick={() => setShowProfile(!showProfile)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <img
                  src={
                    user?.profilePhoto ||
                    "https://randomuser.me/api/portraits/men/32.jpg"
                  }
                  alt={`${user?.name || "User"}'s Profile`}
                  className="profile-avatar"
                />
                <span
                  className={`connection-status ${connected ? "connected" : "disconnected"
                    }`}
                >
                  <span className="status-indicator"></span>
                </span>
              </motion.button>
            </div>

            <div className="header-center">
              {/* Title removed according to Figma */}
            </div>

            <div className="header-right">
              <motion.button
                className="figma-header-btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <IoSearch />
              </motion.button>

              <motion.button
                className="figma-header-btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleUserPanel}
              >
                <IoOptionsOutline />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="map-content">
        <div
          ref={mapRef}
          className="google-map"
          style={{ height: "100%", width: "100%" }}
        />

        <motion.button
          className="figma-recenter-btn"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleLocationRefresh}
          title="現在地に戻る"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z" fill="currentColor" />
          </svg>
        </motion.button>

        <motion.button
          className="figma-zoom-btn"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            // Optional: add actual zoom logic here if needed
            // For now, it just matches the figma visual
          }}
          title="検索"
        >
          <IoSearch />
          <span className="zoom-plus-mini">+</span>
        </motion.button>






      </div>

      <AnimatePresence>
        {userPanelExpanded && (
          <UserPanel
            users={usersWithinRadius}
            onClose={() => setUserPanelExpanded(false)}
            onUserSelect={setSelectedUser}
          />
        )}
      </AnimatePresence>

      {matchRequests.length > 0 && (
        <motion.div
          className="match-requests-indicator"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          onClick={() => setShowMatchResponse(matchRequests[0])}
        >
          <span className="notification-badge">{matchRequests.length}</span>
          マッチリクエスト
        </motion.div>
      )}

      <AnimatePresence>
        {showMatchRequest && (
          <MatchRequestModal
            targetUser={selectedUser}
            onClose={handleMatchRequestClose}
          />
        )}

        {showMatchResponse && (
          <MatchResponseModal
            matchRequest={showMatchResponse}
            onClose={handleMatchResponseClose}
          />
        )}

        {showMeeting && (
          <MeetingModal
            meetingData={showMeeting}
            onClose={handleMeetingClose}
          />
        )}

        {showProfile && (
          <ProfileModal
            onClose={async () => {
              setShowProfile(false);
              // Refresh users within 100km after profile update
              await loadUsersWithinRadius();
            }}
          />
        )}

        {showUserSelection && selectedUserForModal && (
          <UserSelectionModal
            user={selectedUserForModal}
            isOpen={showUserSelection}
            onClose={() => {
              setShowUserSelection(false);
              setSelectedUserForModal(null);
            }}
            onSubmit={handleUserSelectionSubmit}
            onCancel={handleUserSelectionCancel}
            originalMapState={originalMapState.current}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MapView;
