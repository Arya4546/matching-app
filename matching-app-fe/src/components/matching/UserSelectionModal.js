import { RiStarSmileFill } from "react-icons/ri";
import { MdOutlineCancel } from "react-icons/md";
import { RiSendPlaneFill } from "react-icons/ri";
import { IoMdWalk } from "react-icons/io";
import { MdLunchDining } from "react-icons/md";
import { FaHeart } from "react-icons/fa";
import { MdEmergency } from "react-icons/md";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Users, User } from 'lucide-react';
import { matchingAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { useLocation } from '../../contexts/LocationContext';
import MeetingPointsService from '../../services/meetingPointsService';
import ApproachLoading from '../map/ApproachLoading';
import MatchSuccess from './MatchSuccess';
import '../../styles/UserSelectionModal.css';

const UserSelectionModal = ({ user, isOpen, onClose, onSubmit, onCancel, originalMapState, approachState }) => {
  const { currentLocation } = useLocation();
  const [selectedMeetingReason, setSelectedMeetingReason] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [meetingPoints, setMeetingPoints] = useState([]);
  const [loadingPoints, setLoadingPoints] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCoordinates, setShowCoordinates] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showMeetingRequest, setShowMeetingRequest] = useState(false);
  const [showStatusTooltip, setShowStatusTooltip] = useState(false);
  const [activeStatusTooltip, setActiveStatusTooltip] = useState(null);
  const [selectedRequestReasons, setSelectedRequestReasons] = useState([]);
  const [selectedTag, setSelectedTag] = useState('walk');
  const [selectedUrgency, setSelectedUrgency] = useState('5m');

  const URGENCY_OPTIONS = [
    { value: '5m', label: '\u0035\u5206' },
    { value: '1h', label: '\u0031\u6642\u9593' },
  ];

  // Auto-hide tooltips after a short delay
  useEffect(() => {
    if (!activeStatusTooltip) return;
    const id = setTimeout(() => setActiveStatusTooltip(null), 1500);
    return () => clearTimeout(id);
  }, [activeStatusTooltip]);

  useEffect(() => {
    if (!showStatusTooltip) return;
    const id = setTimeout(() => setShowStatusTooltip(false), 1500);
    return () => clearTimeout(id);
  }, [showStatusTooltip]);
  const modalRef = useRef(null);

  const MEETING_REASONS = [
    { value: "walk", label: "散歩", emoji: <IoMdWalk />, icon: "walk", color: "#4CAF50" },
    { value: "lunch", label: "食事", emoji: <MdLunchDining />, icon: "lunch", color: "#FF6B35" },
    { value: "meeting", label: "出会い", emoji: <FaHeart />, icon: "meeting", color: "#E91E63" },
    { value: "urgent", label: "至急", emoji: <MdEmergency />, icon: "urgent", color: "#F44336" },
  ];
  const getAgeFromBirthYear = () => {
    try {
      const raw = user?.birth_year;
      if (raw === undefined || raw === null) return null;
      const n = Number(raw);
      if (!Number.isFinite(n)) return null;
      if (n >= 0 && n <= 130) return Math.max(0, Math.floor(n));
      const currentYear = new Date().getFullYear();
      if (n >= 1900 && n <= currentYear) return currentYear - n;
      return null;
    } catch (_) {
      return null;
    }
  };

  const getGenderLabel = (g) => {
    if (!g) return '—';
    const key = String(g).toLowerCase();
    if (key === 'male' || key === 'm' || key === 'man') return '男性';
    if (key === 'female' || key === 'f' || key === 'woman') return '女性';
    return 'その他';
  };

  const getGenderIcon = (g) => {
    if (!g) return null;
    const key = String(g).toLowerCase();
    if (key === 'male' || key === 'm' || key === 'man') return '/img/male.png';
    if (key === 'female' || key === 'f' || key === 'woman') return '/img/female.png';
    return '/img/other.png';
  };

  const getStatusReason = () => {
    const statusValue = user?.status || user?.meetingReason || user?.reason;
    if (!statusValue) return null;
    return MEETING_REASONS.find(r => r.value === statusValue) || null;
  };

  const rawRate = Number(user?.rate ?? 0);
  const meetingCount = Number(user?.meeting_count ?? 0);
  const fallbackRating = Number(user?.rating ?? 0);
  const ratingValue = meetingCount > 0 ? (rawRate / meetingCount) : fallbackRating;
  const age = getAgeFromBirthYear();
  const genderLabel = getGenderLabel(user?.gender);
  const statusReason = getStatusReason();
  const displayName = `${user?.name || 'ユーザー'}${age ? ` (${age}歳)` : ''}`;

  const rawStatus = user?.status;
  const normalizedStatuses = Array.isArray(rawStatus)
    ? rawStatus.filter(Boolean)
    : (rawStatus ? [rawStatus] : []);
  const statusIcons = normalizedStatuses
    .map((val) => MEETING_REASONS.find(r => r.value === val) || null)
    .filter(Boolean);



  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setSelectedUrgency('5m');
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Show user profile on map when modal opens
  useEffect(() => {
    if (isOpen && user) {
      showUserProfileOnMap();
    }
  }, [isOpen, user]);

  // Load meeting points when reason is selected
  useEffect(() => {
    if (selectedMeetingReason && user && currentLocation) {
      fetchMeetingPoints();
    }
  }, [selectedMeetingReason]);

  // Handle meeting point marker clicks from map
  useEffect(() => {
    const handleMarkerSelection = (event) => {
      const point = event.detail;
      setSelectedLocation(point);
      toast.success(`選択しました: ${point.name}`);
    };

    window.addEventListener("meetingPointSelected", handleMarkerSelection);
    return () => {
      window.removeEventListener("meetingPointSelected", handleMarkerSelection);
    };
  }, []);

  // Clean up map markers when modal closes
  useEffect(() => {
    return () => {
      MeetingPointsService.clearMeetingMarkers(true);
    };
  }, []);

  const shiftMapUpward = () => {
    if (!window.googleMapsService || !window.googleMapsService.map) return;

    // Check if it's desktop/PC view
    const isDesktop = window.innerWidth >= 1024;

    // Find the map container element
    const mapContainer = document.querySelector('.google-map');
    if (mapContainer) {
      if (isDesktop) {
        // In PC mode, shift the map to the right to make room for the sidebar
        mapContainer.classList.add('map-shifted-right');
      } else {
        // In mobile mode, shift the map upward
        mapContainer.classList.add('map-shifted-up');
      }
    }

    // Trigger a resize event to ensure the map renders properly
    setTimeout(() => {
      if (window.google && window.google.maps && window.google.maps.event) {
        window.google.maps.event.trigger(window.googleMapsService.map, 'resize');
      }
    }, 100);
  };

  // Smooth close function with animation
  const smoothCloseModal = () => {
    if (isClosing) {
      console.log('⚠️ Modal already closing, ignoring duplicate close request');
      return;
    }

    console.log('🔄 Starting smooth modal close animation...');
    setIsClosing(true);

    // Clear meeting points from map
    MeetingPointsService.clearMeetingMarkers();

    // Hide coordinates display
    setShowCoordinates(false);

    // Close user profile info window
    if (window.googleMapsService) {
      window.googleMapsService.closeAllInfoWindows();
    }

    // Restore map position
    restoreMapPosition();

    // Close modal after animation completes (250ms for smooth transition)
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 250);
  };

  const restoreMapPosition = () => {
    console.log('🔄 Restoring map position...');
    setIsRestoring(true);

    // Set data attribute to signal that modal is restoring
    if (modalRef.current) {
      modalRef.current.setAttribute('data-restoring', 'true');
    }

    if (!window.googleMapsService || !window.googleMapsService.map) {
      console.warn('GoogleMapsService or map not available');
      setIsRestoring(false);
      if (modalRef.current) {
        modalRef.current.setAttribute('data-restoring', 'false');
      }
      return;
    }

    // Find the map container element
    const mapContainer = document.querySelector('.google-map');
    if (mapContainer) {
      // Remove CSS classes to restore the map position
      mapContainer.classList.remove('map-shifted-up');
      mapContainer.classList.remove('map-shifted-right');
      console.log('✅ Removed map shift CSS classes');
    }

    // Always restore to original map state (as it was when user first logged in)
    if (originalMapState && originalMapState.current) {
      const map = window.googleMapsService.map;
      const { center, zoom, bounds } = originalMapState.current;

      console.log('📍 Restoring to original map state:', originalMapState.current);

      // Restore center and zoom
      if (center && zoom) {
        map.setCenter(center);
        map.setZoom(zoom);
        console.log('✅ Restored original map center and zoom');
      }

      // If bounds are available, use them to ensure all markers are visible
      if (bounds && !bounds.isEmpty()) {
        setTimeout(() => {
          map.fitBounds(bounds);
          console.log('✅ Restored original map bounds');
        }, 200);
      }
    } else {
      console.warn('⚠️ Original map state not available, using fallback');
      // Fallback to 100km view if original state is not available
      if (currentLocation && currentLocation.lat && currentLocation.lng) {
        const map = window.googleMapsService.map;
        const userLocation = new window.google.maps.LatLng(
          currentLocation.lat,
          currentLocation.lng
        );

        map.setCenter(userLocation);
        map.setZoom(8); // 100km view
        console.log('✅ Fallback: Map centered on user location with 100km view');
      }
    }

    // Trigger a resize event to restore the map to full screen
    setTimeout(() => {
      if (window.google && window.google.maps && window.google.maps.event) {
        window.google.maps.event.trigger(window.googleMapsService.map, 'resize');
        console.log('✅ Triggered map resize event');
      }
      setIsRestoring(false);

      // Clear the data attribute
      if (modalRef.current) {
        modalRef.current.setAttribute('data-restoring', 'false');
      }
    }, 100);
  };

  const showUserProfileOnMap = () => {
    if (!user || !window.googleMapsService) return;

    // Find the user's marker and show their info window
    const userMarker = window.googleMapsService.markers.get(user.id || user._id);
    const userInfoWindow = window.googleMapsService.infoWindows.get(user.id || user._id);

    if (userMarker && userInfoWindow) {
      // Close all other info windows first
      window.googleMapsService.closeAllInfoWindows();
      // Show the user's profile info window
      userInfoWindow.open(window.googleMapsService.map, userMarker);
    }

    // Shift map upward to prevent location obscuring
    shiftMapUpward();
  };

  const fetchMeetingPoints = async () => {
    if (!user?.location || !currentLocation) {
      console.log("Missing location data");
      toast.warning("待ち合わせ場所の提案に位置データが利用できません");
      return;
    }

    setLoadingPoints(true);
    try {
      const userLocation = {
        lat: currentLocation.lat,
        lng: currentLocation.lng,
      };

      const targetLocation = {
        lat: user.location.coordinates[1],
        lng: user.location.coordinates[0],
      };

      console.log("User location:", userLocation);
      console.log("Target location:", targetLocation);

      // Initialize service with Google Maps
      if (window.google && window.googleMapsService?.map) {
        MeetingPointsService.setGoogle(
          window.google,
          window.googleMapsService.map
        );
      }

      const points = await MeetingPointsService.findMeetingPoints(
        userLocation,
        targetLocation,
        selectedMeetingReason
      );

      if (points && points.length > 0) {
        setMeetingPoints(points);
        setSelectedLocation(points[0]); // Auto-select first point
      } else {
        // Generate fallback points
        const fallbackPoints = MeetingPointsService.getFallbackMeetingPoints(
          userLocation,
          targetLocation,
          selectedMeetingReason
        );
        setMeetingPoints(fallbackPoints);
        if (fallbackPoints.length > 0) {
          setSelectedLocation(fallbackPoints[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching meeting points:", error);
      toast.error("待ち合わせ場所の取得に失敗しました");
    } finally {
      setLoadingPoints(false);
    }
  };


  // Handle click outside modal to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        smoothCloseModal();
      }
    };

    const handleTouchOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        smoothCloseModal();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleTouchOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleTouchOutside);
    };
  }, [isOpen, onClose]);

  const handleLocationSelect = (location) => {
    try {
      setSelectedLocation(location);
      // Show on map immediately without panning
      MeetingPointsService.selectMeetingPoint(location);
      toast.success(`待ち合わせ場所を選択しました: ${location.name}`);

      // Show coordinates display on PC
      setShowCoordinates(true);

      // Map remains fixed - only the meeting point marker is displayed
      // No automatic panning or zooming to keep the map view stable
    } catch (error) {
      console.error('Error selecting location:', error);
      toast.error('場所の選択中にエラーが発生しました');
    }
  };

  const handleMeetupRequest = () => {
    setShowMeetingRequest(true);
  };

  const smoothPanToMeetingPoint = (meetingLocation) => {
    try {
      // Comprehensive null checks
      if (!user || !window.googleMapsService || !window.googleMapsService.map || !currentLocation) {
        console.warn('Missing required data for smooth pan:', { user, googleMapsService: !!window.googleMapsService, currentLocation });
        return;
      }

      // Check if meetingLocation has required properties
      if (!meetingLocation || !meetingLocation.location ||
        typeof meetingLocation.location.lat !== 'number' ||
        typeof meetingLocation.location.lng !== 'number') {
        console.warn('Invalid meeting location data:', meetingLocation);
        return;
      }

      // Check if user has valid location data
      if (!user.location || !user.location.coordinates ||
        !Array.isArray(user.location.coordinates) ||
        user.location.coordinates.length < 2) {
        console.warn('Invalid user location data:', user.location);
        return;
      }

      // Check if currentLocation has valid data
      if (typeof currentLocation.latitude !== 'number' ||
        typeof currentLocation.longitude !== 'number') {
        console.warn('Invalid current location data:', currentLocation);
        return;
      }

      const currentUserLocation = {
        lat: currentLocation.latitude,
        lng: currentLocation.longitude
      };

      const selectedUserLocation = {
        lat: user.location.coordinates[1],
        lng: user.location.coordinates[0]
      };

      const meetingPoint = {
        lat: meetingLocation.location.lat,
        lng: meetingLocation.location.lng
      };

      // Create bounds to include all three locations
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(currentUserLocation);
      bounds.extend(selectedUserLocation);
      bounds.extend(meetingPoint);

      // Validate bounds
      if (!bounds || bounds.isEmpty()) {
        console.warn('Invalid bounds created');
        return;
      }

      // First, smoothly pan to the center of the bounds
      const center = bounds.getCenter();
      if (center) {
        window.googleMapsService.map.panTo(center);
      }

      // Then, after a short delay, fit the bounds with smooth transition
      setTimeout(() => {
        try {
          // Check if map is still valid
          if (!window.googleMapsService || !window.googleMapsService.map) {
            console.warn('Map service no longer available');
            return;
          }

          window.googleMapsService.map.fitBounds(bounds, {
            top: 120,    // Extra padding to account for modal
            right: 60,   // Generous padding
            bottom: 60,  // Generous padding
            left: 60     // Generous padding
          });

          // Set a maximum zoom level with smooth transition
          const listener = window.google.maps.event.addListener(window.googleMapsService.map, 'idle', () => {
            try {
              const currentZoom = window.googleMapsService.map.getZoom();
              if (currentZoom > 11) {  // Lower zoom level for better overview
                // Smooth zoom transition
                window.googleMapsService.map.setZoom(11);
              }
              window.google.maps.event.removeListener(listener);
            } catch (error) {
              console.error('Error in idle listener:', error);
            }
          });
        } catch (error) {
          console.error('Error in setTimeout callback:', error);
        }
      }, 300); // 300ms delay for smooth transition
    } catch (error) {
      console.error('Error in smoothPanToMeetingPoint:', error);
    }
  };

  const handleSubmit = async () => {
    // When meeting request modal is open, use multi-select reasons
    let reason = '';
    if (showMeetingRequest) {
      if (!selectedRequestReasons || selectedRequestReasons.length === 0) {
        toast.error("待ち合わせの理由を選択してください");
        return;
      }
      const labels = selectedRequestReasons
        .map((val) => MEETING_REASONS.find((r) => r.value === val)?.label || val);
      reason = labels.join(', ');
    } else {
      if (!selectedMeetingReason) {
        toast.error("待ち合わせの理由を選択してください");
        return;
      }
      reason = MEETING_REASONS.find((r) => r.value === selectedMeetingReason)?.label || selectedMeetingReason;
      // Optional legacy location requirement retained outside modal
      if (!selectedLocation && meetingPoints.length > 0) {
        toast.error("待ち合わせ場所を選択してください");
        return;
      }
    }

    setLoading(true);

    try {
      // Include meeting point in request if available
      const requestData = {
        targetUserId: user.id || user._id,
        meetingReason: reason,
        urgency: selectedUrgency,
        meetingPoint: null,
      };

      const response = await matchingAPI.sendMatchRequest(
        requestData.targetUserId,
        requestData.meetingReason,
        requestData.urgency
      );

      if (response.data) {
        toast.success(`${user.name}にマッチリクエストを送信しました！`);

        // If a meeting point was selected, keep it on the map
        if (selectedLocation) {
          MeetingPointsService.selectMeetingPoint(selectedLocation);
        }

        // Close user profile info window
        if (window.googleMapsService) {
          window.googleMapsService.closeAllInfoWindows();
        }

        // Use smooth close animation after successful submission
        smoothCloseModal();
      }
    } catch (error) {
      console.error("Error sending match request:", error);
      toast.error("マッチリクエストの送信に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Clear modal state
    setSelectedMeetingReason('');
    setSelectedLocation(null);
    setMeetingPoints([]);
    setShowCoordinates(false);
    setSelectedUrgency('5m');
    MeetingPointsService.selectedMeetingPoint = null;

    // Use smooth close animation
    smoothCloseModal();
    onCancel();
  };

  if (!isOpen || !user) return null;

  // Check if it's desktop/PC view
  const isDesktop = window.innerWidth >= 1024;

  return (
    <AnimatePresence>
      <div
        className="user-selection-modal-overlay"
        style={{
          opacity: isClosing ? 0 : 1,
          transition: 'opacity 250ms ease-out'
        }}
      >
        {isDesktop ? (
          // PC Sidebar Layout
          <motion.div
            ref={modalRef}
            className="user-selection-sidebar"
            initial={{ x: '-100%' }}
            animate={{
              x: isClosing ? '-100%' : 0,
              opacity: isClosing ? 0 : 1
            }}
            exit={{ x: '-100%' }}
            transition={{
              type: 'spring',
              damping: 25,
              stiffness: 200,
              duration: isClosing ? 0.25 : undefined
            }}
          >
            {/* Header Section - User Information (Snapchat-like playful) */}
            <div className="modal-header" style={{ position: 'relative' }}>
              <div className="user-profile" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                {/* Left: Avatar + Rating */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <img
                    src={user.profilePhoto || "https://randomuser.me/api/portraits/men/32.jpg"}
                    alt={user.name}
                    className="user-avatar"
                  />
                  {/* Reviews (rate) under avatar */}
                  <div style={{ position: 'relative', marginTop: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }} title={`レビュー: ${ratingValue.toFixed ? ratingValue.toFixed(1) : ratingValue}`}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <span key={i} style={{ color: i <= Math.round(Math.min(5, Math.max(0, ratingValue))) ? '#FFC107' : '#E5E7EB', fontSize: 14 }}>★</span>
                      ))}
                    </div>
                    <div style={{ position: 'absolute', top: -10, right: -15, background: 'transparent', color: '#ffffff', borderRadius: 8, padding: '1px 6px', fontSize: 12, fontWeight: 800 }}>
                      {ratingValue && ratingValue.toFixed ? ratingValue.toFixed(1) : (Number(ratingValue) || 0).toFixed(1)}
                    </div>
                  </div>
                </div>

                {/* Middle: Name (Age) + Meeting count + Status icons row */}
                <div style={{ flex: 1, minWidth: 0, paddingLeft: 8, paddingRight: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ fontWeight: 800, fontSize: 16, lineHeight: 1.2, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {displayName}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3F4F6', padding: '4px 8px', borderRadius: 999, width: 32, height: 32 }}>
                      {getGenderIcon(user?.gender) && (
                        <img
                          src={getGenderIcon(user?.gender)}
                          alt={genderLabel}
                          style={{ width: 24, height: 24, objectFit: 'contain' }}
                        />
                      )}
                    </div>
                  </div>
                  {/* Meeting count between name and status icons */}
                  <div style={{ marginTop: 4, fontSize: 12, fontWeight: 700, color: '#ffffff' }}>
                    面会回数: {Number.isFinite(meetingCount) ? meetingCount : 0}
                  </div>
                  {statusIcons.length > 0 && (
                    <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end' }}>
                      {statusIcons.map((s) => (
                        <div key={s.value} style={{ position: 'relative', marginRight: 6, marginBottom: 6 }}>
                          <button
                            onClick={() => setActiveStatusTooltip(s.value)}
                            style={{
                              width: 42,
                              height: 42,
                              borderRadius: 15,
                              background: s.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: `${s.color}40 0px 2px 8px`,
                              border: 'none',
                              boxSizing: 'border-box',
                              padding: 0,
                              cursor: 'pointer'
                            }}
                            title={s.label}
                          >
                            <span style={{ color: '#fff', fontSize: 24 }}>{s.emoji}</span>
                          </button>
                          <AnimatePresence>
                            {activeStatusTooltip === s.value && (
                              <motion.div
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 6 }}
                                transition={{ duration: 0.15 }}
                                style={{
                                  position: 'absolute', bottom: 54, left: '50%', transform: 'translateX(-50%)',
                                  background: '#111827', color: '#fff', padding: '6px 10px', borderRadius: 8,
                                  fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', boxShadow: '0 6px 20px rgba(0,0,0,0.25)'
                                }}
                              >
                                {s.label}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: Status icon with tooltip */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, position: 'relative' }}>
                  {/* gender moved next to name */}
                </div>
              </div>
              {/* Meeting reason icon in bottom-right corner of header */}
              {statusReason && (
                <div style={{ position: 'absolute', bottom: 12, right: 12, zIndex: 10 }}>
                  <button
                    onClick={() => setShowStatusTooltip(true)}
                    style={{
                      width: 72, height: 72, borderRadius: 24, border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', padding: 0,
                      background: statusReason.color
                    }}
                    title={statusReason.label}
                  >
                    <span style={{ color: '#fff', fontSize: 36 }}>{statusReason.emoji}</span>
                  </button>
                  <AnimatePresence>
                    {showStatusTooltip && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.15 }}
                        style={{
                          position: 'absolute', bottom: 80, right: 0, background: '#111827', color: '#fff',
                          padding: '6px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', boxShadow: '0 6px 20px rgba(0,0,0,0.25)'
                        }}
                      >
                        {statusReason.label}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Meeting Reasons Section */}
            <div className="meeting-reasons-section">
              {/* PC Layout - Vertical with text below icons */}
              <div className="reasons-pc-vertical-layout">
                {MEETING_REASONS.map((reason) => (
                  <div
                    key={reason.value}
                    className={`reason-pc-horizontal-item ${selectedMeetingReason === reason.value ? 'selected' : ''}`}
                    onClick={() => setSelectedMeetingReason(reason.value)}
                  >
                    <div
                      className="reason-pc-horizontal-icon"
                      style={{
                        backgroundColor: selectedMeetingReason === reason.value ? '#ffffff' : reason.color,
                        boxShadow: selectedMeetingReason === reason.value
                          ? `0 4px 12px ${reason.color}40`
                          : `0 2px 8px ${reason.color}40`
                      }}
                    >
                      <span
                        className="reason-pc-horizontal-emoji"
                        style={{
                          color: selectedMeetingReason === reason.value ? reason.color : '#ffffff'
                        }}
                      >
                        {reason.emoji}
                      </span>
                    </div>
                    <span className="reason-pc-horizontal-label">{reason.label}</span>
                  </div>
                ))}
              </div>
              {/* {selectedMeetingReason === "other" && (
              <div className="custom-reason-input">
                <input
                  type="text"
                  placeholder="理由を入力してください"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="custom-reason-field"
                />
              </div>
            )} */}
            </div>

            <div className="urgency-selector-section">
              <div className="urgency-selector-title">{'\u7dca\u6025\u5ea6'}</div>
              <div className="urgency-selector-options">
                {URGENCY_OPTIONS.map((option) => (
                  <button
                    type="button"
                    key={option.value}
                    className={`urgency-option-chip ${
                      selectedUrgency === option.value ? "selected" : ""
                    }`}
                    onClick={() => setSelectedUrgency(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Meeting Locations Section */}
            <div className="meeting-locations-section">
              {/* <h4 className="section-title">
              <MapPin size={18} />
              Meeting Locations
            </h4> */}
              <div className="locations-scrollable-list">
                {loadingPoints ? (
                  <div className="loading-message">待ち合わせ場所を検索中...</div>
                ) : meetingPoints.length > 0 ? (
                  meetingPoints.map((location) => (
                    <div
                      key={location.id}
                      className={`location-item ${selectedLocation?.id === location.id ? 'selected' : ''}`}
                      onClick={() => handleLocationSelect(location)}
                    >
                      <div className="display-flex">
                        <div className="location-icon">
                          <MapPin size={18} />
                        </div>
                        <div className="location-name">{location.name}</div>
                        <div className="location-address">{location.address}</div>
                      </div>
                      {location.distanceToUser && location.distanceToTarget && (
                        <div className="location-distances">
                          <div className="distance-info">
                            あなた: {location.distanceToUser} km
                            {location.walkingTimeUser && (
                              <span className="walking-time">
                                ({MeetingPointsService.formatWalkingTime(location.walkingTimeUser)})
                              </span>
                            )}
                          </div>
                          <div className="distance-info">
                            {user.name}: {location.distanceToTarget} km
                            {location.walkingTimeTarget && (
                              <span className="walking-time">
                                ({MeetingPointsService.formatWalkingTime(location.walkingTimeTarget)})
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="no-locations-message">
                    待ち合わせ場所が見つかりませんでした
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons - 1/8 of modal height */}
            <div className="modal-actions">
              <div>
                <button className="btn-cancel" onClick={handleCancel}>
                  <MdOutlineCancel className="btn-icon" />
                  <span>キャンセル</span>
                </button>
              </div>
              <div>
                <button
                  className="btn-submit"
                  onClick={handleSubmit}
                  disabled={!selectedMeetingReason || (!selectedLocation && meetingPoints.length > 0) || loading}
                >
                  <RiSendPlaneFill className="btn-icon" />
                  <span>{loading ? '送信中...' : '転送'}</span>
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          // Mobile Modal Layout
          <motion.div
            ref={modalRef}
            className="user-selection-modal"
            initial={{ y: '100%' }}
            animate={{
              y: isClosing ? '100%' : 0,
              opacity: isClosing ? 0 : 1
            }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              damping: 25,
              stiffness: 200,
              duration: isClosing ? 0.25 : undefined
            }}
          >
            {/* Premium Bottom Sheet Layout */}
            <div className="premium-bottom-sheet-content">
              {/* Header Row: Left(Avatar + Info) | Right(Action Button) */}
              <div className="sheet-header-row">
                <div className="avatar-info-cluster">
                  <div className="avatar-wrapper">
                    <img
                      src={user.profilePhoto || "https://randomuser.me/api/portraits/men/32.jpg"}
                      alt={user.name}
                      className="large-avatar"
                    />
                    {getGenderIcon(user?.gender) && (
                      <div className="gender-badge">
                        <img src={getGenderIcon(user?.gender)} alt="gender" />
                      </div>
                    )}
                  </div>
                  <div className="user-text-details">
                    <div className="name-age-row">
                      <span className="name-text">{user?.name || 'ユーザー'}</span>
                      {age && <span className="age-pill">{age}歳</span>}
                    </div>
                    <div className="rating-row">
                      <div className="stars-cluster">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <RiStarSmileFill
                            key={i}
                            className="star-icon"
                            style={{ color: i <= Math.round(Number(ratingValue) || 0) ? '#FFB800' : '#E5E7EB' }}
                          />
                        ))}
                      </div>
                      <span className="review-count">{meetingCount > 0 ? `${meetingCount}人` : 'New'}</span>
                    </div>
                  </div>
                </div>

                {/* Right side floating action */}
                <button className="user-action-btn" onClick={onClose}>
                  <User size={20} color="#00C194" />
                </button>
              </div>

              {/* Interest Tags Row */}
              <div className="tags-row">
                {MEETING_REASONS.map((s) => {
                  const isSelected = selectedTag === s.value;
                  return (
                    <div
                      key={s.value}
                      className={`pill-container ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedTag(s.value)}
                    >
                      <div className="pill-circle">
                        <span className="pill-icon">{s.emoji}</span>
                      </div>
                      <span className="pill-label">{s.label === '散歩' ? 'stroll' : s.label === '食事' ? 'meal' : s.label === '出会い' ? 'encounter' : 'urgent'}</span>
                      {isSelected && (
                        <div className="pill-check-badge">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="urgency-selector-section mobile-urgency-selector">
                <div className="urgency-selector-title">{'\u7dca\u6025\u5ea6'}</div>
                <div className="urgency-selector-options">
                  {URGENCY_OPTIONS.map((option) => (
                    <button
                      type="button"
                      key={option.value}
                      className={`urgency-option-chip ${
                        selectedUrgency === option.value ? "selected" : ""
                      }`}
                      onClick={() => setSelectedUrgency(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bio Section */}
              <div className="bio-section">
                <span className="bio-label">self-introduction</span>
                <p className="bio-text">
                  {user.aboutme || user.bio || "As a web freelancer, I strive to create simple and comfortable designs and code every day."}
                </p>
              </div>

              {/* Album Section */}
              <div className="album-section">
                <div className="album-photos">
                  <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80" alt="photo1" className="album-thumbnail" />
                  <img src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=200&q=80" alt="photo2" className="album-thumbnail" />
                </div>
              </div>

              {/* CTA Section - Fixed footer with white pill button */}
              <div className="cta-footer-bar">
                <motion.button
                  className="pill-cta-btn"
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    const reason =
                      MEETING_REASONS.find((r) => r.value === selectedTag)?.label ||
                      MEETING_REASONS[0].label;
                    onSubmit({
                      targetUserId: user.id || user._id,
                      meetingReason: reason,
                      urgency: selectedUrgency,
                    });
                  }}
                  disabled={approachState === "loading"}
                >
                  <RiSendPlaneFill className="cta-plane-icon" />
                  <span>{approachState === "loading" ? 'loading...' : 'approach'}</span>
                </motion.button>
              </div>
            </div>

            {/* Approach Loading Screen */}
            <AnimatePresence>
              {approachState === "loading" && (
                <ApproachLoading
                  user={user}
                />
              )}
            </AnimatePresence>

            {/* Match Success Screen */}
            <AnimatePresence>
              {approachState === "success" && (
                <MatchSuccess
                  user={user}
                  onReturn={onClose}
                />
              )}
            </AnimatePresence>

            {/* Meeting Request Sections - Rise from bottom as single modal */}
            <AnimatePresence>
              {showMeetingRequest && (
                <>
                  {/* Overlay */}
                  <motion.div
                    className="meeting-request-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    onClick={() => setShowMeetingRequest(false)}
                  />

                  {/* Meeting Request Modal */}
                  <motion.div
                    className="meeting-request-modal"
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0 }}
                    transition={{
                      type: 'spring',
                      damping: 25,
                      stiffness: 200,
                      duration: 0.4
                    }}
                    style={{ maxHeight: '55vh' }}
                  >
                    {/* Meeting Reasons Section */}
                    <div className="meeting-reasons-section">
                      {/* Mobile Layout - Vertical icons */}
                      <div className="reasons-horizontal-scroll" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', columnGap: 12, rowGap: 12 }}>
                        {MEETING_REASONS.map((reason) => {
                          const isSelected = selectedRequestReasons.includes(reason.value);
                          return (
                            <div
                              key={reason.value}
                              className={`reason-icon-item ${isSelected ? 'selected' : ''}`}
                              onClick={() => {
                                setSelectedRequestReasons((prev) =>
                                  prev.includes(reason.value)
                                    ? prev.filter((v) => v !== reason.value)
                                    : [...prev, reason.value]
                                );
                              }}
                              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                            >
                              <div
                                className="reason-icon"
                                style={{
                                  backgroundColor: isSelected ? '#ffffff' : reason.color,
                                  boxShadow: isSelected
                                    ? `0 4px 12px ${reason.color}40`
                                    : `0 2px 8px ${reason.color}40`
                                }}
                              >
                                <span
                                  className="reason-emoji"
                                  style={{
                                    color: isSelected ? reason.color : '#ffffff'
                                  }}
                                >
                                  {reason.emoji}
                                </span>
                              </div>
                              <span className="reason-label" style={{ width: '100%', textAlign: 'center', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', marginTop: 6 }}>{reason.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Action Buttons - 1/8 of modal height */}
                    <div className="modal-actions">
                      {/* <div>
                      <button className="btn-cancel" onClick={handleCancel}>
                        <MdOutlineCancel className="btn-icon" />
                        <span>キャンセル</span>
                      </button>
                    </div> */}
                      <div>
                        <button
                          className="btn-submit"
                          onClick={handleSubmit}
                          disabled={selectedRequestReasons.length === 0 || loading}
                        >
                          <RiSendPlaneFill className="btn-icon" />
                          <span>{loading ? 'アプローチ中...' : 'アプローチ'}</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Coordinate Display for PC */}
      {isDesktop && showCoordinates && selectedLocation && (
        <motion.div
          className="coordinate-display"
          initial={{ opacity: 0, x: 100, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.8 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div className="coordinate-header">
            <div className="coordinate-icon">
              <MapPin size={16} />
            </div>
            <span className="coordinate-title">選択された場所</span>
          </div>
          <div className="coordinate-content">
            <div className="coordinate-item">
              <span className="coordinate-label">緯度:</span>
              <span className="coordinate-value">{selectedLocation.lat?.toFixed(6) || 'N/A'}</span>
            </div>
            <div className="coordinate-item">
              <span className="coordinate-label">経度:</span>
              <span className="coordinate-value">{selectedLocation.lng?.toFixed(6) || 'N/A'}</span>
            </div>
            <div className="coordinate-item">
              <span className="coordinate-label">場所:</span>
              <span className="coordinate-value">{selectedLocation.name || 'N/A'}</span>
            </div>
            {selectedLocation.address && (
              <div className="coordinate-item">
                <span className="coordinate-label">住所:</span>
                <span className="coordinate-value">{selectedLocation.address}</span>
              </div>
            )}

            {/* Distance and Time Information */}
            <div className="coordinate-section-divider"></div>

            <div className="coordinate-section-title">距離・時間情報</div>

            <div className="coordinate-item">
              <span className="coordinate-label">あなた:</span>
              <span className="coordinate-value">
                {selectedLocation.distanceToUser ? `${selectedLocation.distanceToUser} km` : 'N/A'}
                {selectedLocation.walkingTimeUser && (
                  <span className="walking-time-display">
                    ({MeetingPointsService.formatWalkingTime(selectedLocation.walkingTimeUser)})
                  </span>
                )}
              </span>
            </div>

            <div className="coordinate-item">
              <span className="coordinate-label">{user.name}:</span>
              <span className="coordinate-value">
                {selectedLocation.distanceToTarget ? `${selectedLocation.distanceToTarget} km` : 'N/A'}
                {selectedLocation.walkingTimeTarget && (
                  <span className="walking-time-display">
                    ({MeetingPointsService.formatWalkingTime(selectedLocation.walkingTimeTarget)})
                  </span>
                )}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UserSelectionModal;
