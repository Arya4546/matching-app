import { Loader } from "@googlemaps/js-api-loader";

class GoogleMapsService {
  constructor() {
    this.loader = new Loader({
      apiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
      version: "weekly",
      libraries: ["places", "geometry"],
    });
    this.google = null;
    this.map = null;
    this.markers = new Map();
    this.infoWindows = new Map();
    this.directionsService = null;
    this.directionsRenderer = null;
    this.selectedMarker = null;
    this.blinkingInterval = null;
    this.isBlinking = false;
    this.exclamationMarker = null;
    this.exclamationBlinkingInterval = null;
  }

  async initialize() {
    try {
      this.google = await this.loader.load();
      this.directionsService = new this.google.maps.DirectionsService();
      this.directionsRenderer = new this.google.maps.DirectionsRenderer({
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: "#667eea",
          strokeWeight: 4,
          strokeOpacity: 0.8,
        },
      });

      // Add global function for info window onclick handlers
      if (!window.handleMatchRequest) {
        window.handleMatchRequest = (tempId) => {
          const userData = window.tempUserData && window.tempUserData[tempId];
          if (userData) {
            window.dispatchEvent(
              new CustomEvent("requestMatchWithData", { detail: userData })
            );
            // Clean up temporary data
            delete window.tempUserData[tempId];
          } else {
            console.error("User data not found for tempId:", tempId);
          }
        };
      }

      // Make GoogleMapsService available globally for close button
      window.googleMapsService = this;

      return this.google;
    } catch (error) {
      console.error("Failed to load Google Maps:", error);
      throw error;
    }
  }

  createMap(element, options = {}) {
    if (!this.google) {
      throw new Error("Google Maps not initialized");
    }

    const defaultOptions = {
      zoom: 15,
      center: { lat: 0, lng: 0 },
      disableDefaultUI: true, // Forcefully disable all default buttons
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: false,
      scaleControl: false,
      rotateControl: false,
      clickableIcons: false,
      styles: [
        {
          "elementType": "geometry",
          "stylers": [{ "color": "#f5f5f5" }]
        },
        {
          "elementType": "labels.icon",
          "stylers": [{ "visibility": "off" }]
        },
        {
          "elementType": "labels.text.fill",
          "stylers": [{ "color": "#616161" }]
        },
        {
          "elementType": "labels.text.stroke",
          "stylers": [{ "color": "#f5f5f5" }]
        },
        {
          "featureType": "administrative.land_parcel",
          "elementType": "labels.text.fill",
          "stylers": [{ "color": "#bdbdbd" }]
        },
        {
          "featureType": "poi",
          "elementType": "geometry",
          "stylers": [{ "color": "#eeeeee" }]
        },
        {
          "featureType": "poi",
          "elementType": "labels.text.fill",
          "stylers": [{ "color": "#757575" }]
        },
        {
          "featureType": "poi.park",
          "elementType": "geometry",
          "stylers": [{ "color": "#e5e5e5" }]
        },
        {
          "featureType": "poi.park",
          "elementType": "labels.text.fill",
          "stylers": [{ "color": "#9e9e9e" }]
        },
        {
          "featureType": "road",
          "elementType": "geometry",
          "stylers": [{ "color": "#ffffff" }]
        },
        {
          "featureType": "road.arterial",
          "elementType": "labels.text.fill",
          "stylers": [{ "color": "#757575" }]
        },
        {
          "featureType": "road.highway",
          "elementType": "geometry",
          "stylers": [{ "color": "#dadada" }]
        },
        {
          "featureType": "road.highway",
          "elementType": "labels.text.fill",
          "stylers": [{ "color": "#616161" }]
        },
        {
          "featureType": "road.local",
          "elementType": "labels.text.fill",
          "stylers": [{ "color": "#9e9e9e" }]
        },
        {
          "featureType": "transit.line",
          "elementType": "geometry",
          "stylers": [{ "color": "#e5e5e5" }]
        },
        {
          "featureType": "transit.station",
          "elementType": "geometry",
          "stylers": [{ "color": "#eeeeee" }]
        },
        {
          "featureType": "water",
          "elementType": "geometry",
          "stylers": [{ "color": "#e3f2fd" }]
        },
        {
          "featureType": "water",
          "elementType": "labels.text.fill",
          "stylers": [{ "color": "#90caf9" }]
        },
        {
          "featureType": "road",
          "elementType": "geometry",
          "stylers": [{ "color": "#ffffff" }]
        },
        {
          "featureType": "road.highway",
          "elementType": "geometry",
          "stylers": [{ "color": "#f1f1f1" }]
        },
        // Hide points of interest and transit labels
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }],
        },
        {
          featureType: "transit",
          elementType: "labels",
          stylers: [{ visibility: "off" }],
        },
      ],
    };

    this.map = new this.google.maps.Map(element, {
      ...defaultOptions,
      ...options,
    });
    this.directionsRenderer.setMap(this.map);

    // Add click event listener to close all info windows and reset markers when clicking on the map
    this.google.maps.event.addListener(this.map, "click", async () => {
      await this.closeAllInfoWindows();
      this.clearSelection();
    });

    return this.map;
  }

  createMarker(position, options = {}) {
    if (!this.google || !this.map) {
      throw new Error("Google Maps not initialized or map not created");
    }

    const marker = new this.google.maps.Marker({
      position,
      map: this.map,
      ...options,
    });

    return marker;
  }

  createLocationPin(color, isCurrentUser = false) {
    if (!this.google || !this.google.maps) {
      throw new Error("Google Maps not initialized");
    }

    // Create SVG location pin
    const size = isCurrentUser ? 50 : 44;
    const svg = `
      <svg width="${size}" height="${size}" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
              fill="${color}" stroke="white" stroke-width="2"/>
        <circle cx="12" cy="9" r="3" fill="white"/>
      </svg>
    `;

    return {
      url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg),
      scaledSize: new this.google.maps.Size(size, size),
      anchor: new this.google.maps.Point(size / 2, size),
    };
  }

  getGenderBasedPinColor(gender) {
    // Define colors for different genders
    switch (gender) {
      case 'male':
        return "#4285F4"; // Blue for male
      case 'female':
        return "#f10fdf"; // Pink for female
      case 'other':
        return "#9C27B0"; // Purple for other
      default:
        return "#4285F4"; // Default blue if gender is not specified
    }
  }

  // Get pin colors (body and base) based on gender
  getPinColorsByGender(gender) {
    switch (gender) {
      case 'male':
        return {
          body: '#2196F3', // Blue for male
          base: '#1565C0'  // Darker blue for base
        };
      case 'female':
        return {
          body: '#E91E63', // Pink for female
          base: '#AD1457'  // Darker pink for base
        };
      case 'other':
        return {
          body: '#9C27B0', // Purple for other
          base: '#6A1B9A'  // Darker purple for base
        };
      default:
        return {
          body: '#4285F4', // Default blue
          base: '#1976D2'  // Darker blue for base
        };
    }
  }

  // Start blinking animation for selected marker (disabled - keep static)
  startBlinkingAnimation(marker) {
    if (this.blinkingInterval) {
      clearInterval(this.blinkingInterval);
    }

    this.selectedMarker = marker;
    this.isBlinking = true;

    // Keep the marker static - no blinking animation
    // The exclamation mark will handle the blinking effect
  }

  // Stop blinking animation
  stopBlinkingAnimation() {
    if (this.blinkingInterval) {
      clearInterval(this.blinkingInterval);
      this.blinkingInterval = null;
    }
    this.isBlinking = false;
    this.selectedMarker = null;
  }

  // Create exclamation mark icon
  createExclamationIcon(isVisible = true) {
    if (!this.google || !this.google.maps) {
      throw new Error("Google Maps not initialized");
    }

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    const size = 24; // Smaller size
    canvas.width = size;
    canvas.height = size;

    if (isVisible) {
      // Draw exclamation mark
      context.fillStyle = '#ff4444';
      context.beginPath();
      context.arc(size / 2, size / 2, size / 2 - 1, 0, 2 * Math.PI);
      context.fill();

      // White border
      context.strokeStyle = '#ffffff';
      context.lineWidth = 2;
      context.stroke();

      // Exclamation mark
      context.fillStyle = '#ffffff';
      context.font = 'bold 12px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText('!', size / 2, size / 2);
    }

    // Anchor the exclamation so its center aligns to the user's avatar center
    // User avatar center is ~40px above the pin tip (anchor of user marker)
    return {
      url: canvas.toDataURL('image/png', 1.0),
      scaledSize: new this.google.maps.Size(size, size),
      anchor: new this.google.maps.Point(size / 2, (size / 2) + 65),
    };
  }

  // Show exclamation mark centered on the selected user's avatar pin
  showExclamationMark(userPosition) {
    if (!this.map || !this.google || !userPosition) return;

    // Remove existing exclamation mark
    this.hideExclamationMark();

    // Create exclamation mark marker
    const exclamationIcon = this.createExclamationIcon(true);
    this.exclamationMarker = new this.google.maps.Marker({
      position: {
        lat: userPosition.lat,
        lng: userPosition.lng
      },
      map: this.map,
      icon: exclamationIcon,
      zIndex: 1001, // Higher z-index than user markers
      title: 'Selected User'
    });

    // Start blinking animation
    this.startExclamationBlinking();
  }

  // Start exclamation mark blinking
  startExclamationBlinking() {
    if (this.exclamationBlinkingInterval) {
      clearInterval(this.exclamationBlinkingInterval);
    }

    let isVisible = true;
    this.exclamationBlinkingInterval = setInterval(() => {
      if (!this.exclamationMarker) {
        clearInterval(this.exclamationBlinkingInterval);
        return;
      }

      const icon = this.createExclamationIcon(isVisible);
      this.exclamationMarker.setIcon(icon);
      isVisible = !isVisible;
    }, 600); // Blink every 600ms
  }

  // Hide exclamation mark
  hideExclamationMark() {
    if (this.exclamationBlinkingInterval) {
      clearInterval(this.exclamationBlinkingInterval);
      this.exclamationBlinkingInterval = null;
    }

    if (this.exclamationMarker) {
      this.exclamationMarker.setMap(null);
      this.exclamationMarker = null;
    }
  }

  // Create invisible marker icon for blinking effect
  createInvisibleMarkerIcon() {
    if (!this.google || !this.google.maps) {
      throw new Error("Google Maps not initialized");
    }

    // Create a transparent canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    const pinWidth = 50;
    const pinHeight = 60;

    canvas.width = pinWidth;
    canvas.height = pinHeight;

    // Make the entire canvas transparent
    context.clearRect(0, 0, pinWidth, pinHeight);

    return {
      url: canvas.toDataURL('image/png', 1.0),
      scaledSize: new this.google.maps.Size(pinWidth, pinHeight),
      anchor: new this.google.maps.Point(pinWidth / 2, pinHeight),
    };
  }

  // Clear selection and stop blinking
  clearSelection() {
    this.stopBlinkingAnimation();
    this.hideExclamationMark();

    // Reset all markers to normal state
    for (const [userId, marker] of this.markers) {
      if (marker.userData) {
        const { avatarUrl, isCurrentUser, user } = marker.userData;
        const gender = user?.gender || 'male'; // Default to 'male' if gender is undefined
        this.createAvatarMarkerIcon(avatarUrl, 50, false, isCurrentUser, gender).then(icon => {
          marker.setIcon(icon);
        });
      }
    }
  }

  // Create circular avatar marker icon without pin below
  createAvatarMarkerIcon(avatarUrl, size = 50, isSelected = false, isCurrentUser = false, gender = 'male') {
    if (!this.google || !this.google.maps) {
      throw new Error("Google Maps not initialized");
    }

    // Create canvas for flat, minimalist pin design
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    // Dimension for circular avatar design with shadow padding
    const padding = 12;
    const pinWidth = size + padding * 2;
    const pinHeight = size + padding * 2;
    const radius = size / 2;

    canvas.width = pinWidth;
    canvas.height = pinHeight;

    const centerX = pinWidth / 2;
    const centerY = pinHeight / 2;

    // Enable anti-aliasing for clean edges
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';

    // Draw shadow
    context.shadowColor = 'rgba(0, 0, 0, 0.1)';
    context.shadowBlur = 10;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 4;

    // Draw Pin Shape (Circle + Triangle tail)
    context.fillStyle = '#FFFFFF';
    context.beginPath();
    context.arc(centerX, centerY, radius + 4, 0.15 * Math.PI, 0.85 * Math.PI, true);
    // Draw the tail
    context.lineTo(centerX, centerY + radius + 12);
    context.closePath();
    context.fill();

    // Reset shadow
    context.shadowColor = 'transparent';
    context.shadowBlur = 0;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;

    // Redraw the main circle on top to ensure clean border alignment
    context.fillStyle = '#FFFFFF';
    context.beginPath();
    context.arc(centerX, centerY, radius + 4, 0, 2 * Math.PI);
    context.fill();

    // Draw anchor dot (subtle dot at the tip of the tail)
    context.fillStyle = '#FFFFFF';
    context.beginPath();
    context.arc(centerX, centerY + radius + 12, 2, 0, 2 * Math.PI);
    context.fill();

    // If current user, add a subtle mint glow or ring
    if (isCurrentUser) {
      context.save();
      context.strokeStyle = 'rgba(0, 193, 148, 0.4)';
      context.lineWidth = 2;
      context.beginPath();
      context.arc(centerX, centerY, radius + 7, 0, 2 * Math.PI);
      context.stroke();
      context.restore();
    }

    // Always draw the user's avatar inside the pin (also for current user)
    return this.drawUserAvatar(
      canvas,
      context,
      centerX,
      centerY,
      radius,
      avatarUrl,
      pinWidth,
      pinHeight
    );
  }

  // Draw jewelry symbol for current user
  drawJewelrySymbol(canvas, context, centerX, centerY, radius, pinWidth, pinHeight) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        // Create circular clipping path for jewelry
        context.save();
        context.beginPath();
        context.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        context.clip();

        // Draw the jewelry image
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        context.drawImage(img, centerX - radius, centerY - radius, radius * 2, radius * 2);
        context.restore();

        // Convert canvas to data URL
        const dataUrl = canvas.toDataURL('image/png', 1.0);

        resolve({
          url: dataUrl,
          scaledSize: new this.google.maps.Size(pinWidth, pinHeight),
          anchor: new this.google.maps.Point(centerX, centerY + radius + 12),
        });
      };

      img.onerror = () => {
        // Fallback to light blue diamond shape
        context.fillStyle = '#87CEEB'; // Light blue
        context.beginPath();

        // Draw diamond shape
        const diamondSize = radius * 0.6;
        context.moveTo(centerX, centerY - diamondSize);
        context.lineTo(centerX + diamondSize * 0.6, centerY);
        context.lineTo(centerX, centerY + diamondSize);
        context.lineTo(centerX - diamondSize * 0.6, centerY);
        context.closePath();
        context.fill();

        const dataUrl = canvas.toDataURL('image/png', 1.0);
        resolve({
          url: dataUrl,
          scaledSize: new this.google.maps.Size(pinWidth, pinHeight),
          anchor: new this.google.maps.Point(centerX, centerY + radius + 12),
        });
      };

      img.src = '/img/jewelry.png';
    });
  }

  // Draw user avatar for other users
  drawUserAvatar(canvas, context, centerX, centerY, radius, avatarUrl, pinWidth, pinHeight) {
    return new Promise((resolve) => {
      const loadImage = (url) => new Promise((res, rej) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        try { image.referrerPolicy = 'no-referrer'; } catch (_) { }
        image.onload = () => res(image);
        image.onerror = (e) => rej(e);
        image.src = url;
      });

      const drawAndResolve = (image) => {
        context.save();
        context.beginPath();
        context.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        context.clip();
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        context.drawImage(image, centerX - radius, centerY - radius, radius * 2, radius * 2);
        context.restore();

        try {
          const dataUrl = canvas.toDataURL('image/png', 1.0);
          resolve({
            url: dataUrl,
            scaledSize: new this.google.maps.Size(pinWidth, pinHeight),
            anchor: new this.google.maps.Point(centerX, centerY),
          });
        } catch (e) {
          // If canvas is tainted, try proxied image once
          const proxied = this.toCorsProxyUrl(avatarUrl);
          loadImage(proxied)
            .then((img2) => {
              // Clear avatar area before redraw
              context.save();
              context.beginPath();
              context.arc(centerX, centerY, radius + 1, 0, 2 * Math.PI);
              context.clip();
              context.clearRect(centerX - radius - 2, centerY - radius - 2, (radius + 2) * 2, (radius + 2) * 2);
              context.restore();

              context.save();
              context.beginPath();
              context.arc(centerX, centerY, radius, 0, 2 * Math.PI);
              context.clip();
              context.imageSmoothingEnabled = true;
              context.imageSmoothingQuality = 'high';
              context.drawImage(img2, centerX - radius, centerY - radius, radius * 2, radius * 2);
              context.restore();

              const dataUrl2 = canvas.toDataURL('image/png', 1.0);
              resolve({
                url: dataUrl2,
                scaledSize: new this.google.maps.Size(pinWidth, pinHeight),
                anchor: new this.google.maps.Point(centerX, centerY),
              });
            })
            .catch(() => {
              // Fallback: simple silhouette if both direct and proxy fail
              context.fillStyle = '#87CEEB';
              context.beginPath();
              context.arc(centerX, centerY - radius * 0.2, radius * 0.3, 0, 2 * Math.PI);
              context.fill();
              context.beginPath();
              context.arc(centerX, centerY + radius * 0.2, radius * 0.4, 0, 2 * Math.PI);
              context.fill();
              const dataUrl = canvas.toDataURL('image/png', 1.0);
              resolve({
                url: dataUrl,
                scaledSize: new this.google.maps.Size(pinWidth, pinHeight),
                anchor: new this.google.maps.Point(centerX, centerY),
              });
            });
        }
      };

      const safeUrl = avatarUrl || '';
      loadImage(safeUrl)
        .then((img) => drawAndResolve(img))
        .catch(() => {
          // If direct load fails, try proxy
          const proxied = this.toCorsProxyUrl(safeUrl);
          loadImage(proxied)
            .then((img2) => drawAndResolve(img2))
            .catch(() => {
              // Fallback: simple silhouette
              context.fillStyle = '#87CEEB';
              context.beginPath();
              context.arc(centerX, centerY - radius * 0.2, radius * 0.3, 0, 2 * Math.PI);
              context.fill();
              context.beginPath();
              context.arc(centerX, centerY + radius * 0.2, radius * 0.4, 0, 2 * Math.PI);
              context.fill();
              const dataUrl = canvas.toDataURL('image/png', 1.0);
              resolve({
                url: dataUrl,
                scaledSize: new this.google.maps.Size(pinWidth, pinHeight),
                anchor: new this.google.maps.Point(centerX, centerY),
              });
            });
        });
    });
  }

  toCorsProxyUrl(url) {
    if (!url) return url;
    try {
      const withoutProtocol = url.replace(/^https?:\/\//i, '');
      return `https://images.weserv.nl/?url=${encodeURIComponent(withoutProtocol)}&w=100&h=100&fit=cover`;
    } catch (_) {
      return url;
    }
  }

  async createUserMarker(user, isCurrentUser = false, isWithinRadius = false) {
    const position = {
      lat: user.location.coordinates[1],
      lng: user.location.coordinates[0],
    };

    // Create avatar marker icon
    const avatarUrl = user.profilePhoto || "https://randomuser.me/api/portraits/men/32.jpg";
    const icon = await this.createAvatarMarkerIcon(avatarUrl, 50, false, isCurrentUser, user.gender);

    let markerOptions = {
      title: user.name,
      zIndex: isCurrentUser ? 1000 : isWithinRadius ? 200 : 100,
      icon: icon,
    };

    const marker = this.createMarker(position, markerOptions);

    // Create compact info window with name and address
    const compactInfoContent = this.createCompactInfoWindow(user, isCurrentUser);
    const infoWindow = new this.google.maps.InfoWindow({
      content: compactInfoContent,
    });

    // Store original icon and user data for later use
    marker.userData = {
      user,
      isCurrentUser,
      normalIcon: icon,
      avatarUrl,
    };

    marker.addListener("click", async () => {
      this.closeAllInfoWindows();

      // Clear any existing selection first
      this.clearSelection();

      // Tap Animation: Slight scale up (MatchSuccess Criteria)
      const activeSize = 60;
      const activeIcon = await this.createAvatarMarkerIcon(avatarUrl, activeSize, true, isCurrentUser, user.gender);
      marker.setIcon(activeIcon);

      // For current user, don't show info window (no small profile modal)
      if (isCurrentUser) {
        // Do nothing - don't show the small profile modal for current user
      } else {
        // For other users, only show bottom modal (no info window on pin)
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('showUserSelectionModal', {
            detail: user
          }));
        }, 100);
      }
    });

    // When info window is closed, reset marker to normal size and stop blinking
    this.google.maps.event.addListener(infoWindow, 'closeclick', async () => {
      this.clearSelection();
    });

    this.markers.set(user.id || user._id, marker);
    // this.infoWindows.set(user.id || user._id, infoWindow);

    return marker;
  }

  // Create compact info window content
  createCompactInfoWindow(user, isCurrentUser = false) {
    const displayName = isCurrentUser ? 'あなた' : (user.name || 'ユーザー');
    const address = user.address || '住所未設定';

    return `
      <div class="compact-user-info">
        <div class="compact-name">${displayName}</div>
        <div class="compact-address">${address}</div>
      </div>
      <style>
        .compact-user-info {
          padding: 12px 16px;
          min-width: 200px;
          max-width: 280px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        }
        .compact-name {
          font-size: 16px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 6px;
        }
        .compact-address {
          font-size: 13px;
          color: #6b7280;
          line-height: 1.4;
        }
        .gm-style-iw-c {
          padding: 0 !important;
          border-radius: 12px !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
        }
        .gm-style-iw-d {
          overflow: hidden !important;
        }
      </style>
    `;
  }

  createInfoWindowContent(user, isCurrentUser = false) {
    console.log("aaaaaaaaa", user);

    if (isCurrentUser) {
      return `
      <div class="sophisticated-modal user-modal">
        <div class="modal-content1">
          <div class="modal-header1">
            <div class="profile-left">
              <img src="${user.profilePhoto ||
        "https://randomuser.me/api/portraits/men/32.jpg"
        }" alt="${user.name || "User"}" class="user-avatar" />
            </div>
            <div class="profile-right">
              <div class="user-info-section">
                <div class="user-name-row">
                  <svg class="user-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                  <h3 class="user-name">You</h3>
                </div>
                <div class="user-phone-row">
                  <svg class="phone-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                  </svg>
                  <p class="user-phone">${user.phoneNumber || "未設定"}</p>
                </div>
                <div class="user-location-row">
                  <svg class="location-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  <span class="location-text">${user.address || "未設定"}</span>
                </div>
              </div>
            </div>
            // <button class="modal-close-btn" onclick="window.googleMapsService && window.googleMapsService.closeAllInfoWindows()" style="position: absolute; top: 10px; right: 10px; background: none; border: none; font-size: 18px; cursor: pointer; color: #666; z-index: 10; width: 30px; height: 30px; border-radius: 50%; background: rgba(255,255,255,0.8); display: flex; align-items: center; justify-content: center;">✕</button>
          </div>
        </div>
      </div>
      ${this.getModalStyles()}
      `;
    }

    // Store user data temporarily and use a simple ID reference
    const tempId = `user_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    if (!window.tempUserData) window.tempUserData = {};

    // Debug: Log user data to see what fields are available
    console.log("User data for modal:", user);
    console.log("Phone number field:", user.phoneNumber);
    console.log("All user fields:", Object.keys(user));

    window.tempUserData[tempId] = {
      id: user.id || user._id,
      name: user.name || "",
      location: user.location,
      profilePhoto: user.profilePhoto,
      gender: user.gender || "",
      phoneNumber: user.phoneNumber || "",
      address: user.address || "",
    };
    // <div class="profile-left">
    //     <img src="${user.profilePhoto || "https://randomuser.me/api/portraits/men/32.jpg"}" alt="${user.name || "User"}" class="user-avatar" />
    // </div>
    // <div class="user-phone-row">
    //   <svg class="phone-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    //     <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
    //   </svg>
    //   <p class="user-phone">${user.phoneNumber || "2222222222"}</p>
    // </div>
    return `
      <div class="sophisticated-modal user-modal">
        <div class="modal-content1">
          <div class="modal-header1">
            
            <div class="profile-right">
              <div class="user-info-section">
                <div class="user-name-row">
                  <svg class="user-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                  <h3 class="user-name">${user.name || "Unknown User"}</h3>
                </div>
                
                <div class="user-location-row">
                  <svg class="location-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  <span class="location-text">${user.address || "nara city"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      ${this.getModalStyles()}
    `;
  }

  getModalStyles() {
    return `
      <style>
         .sophisticated-modal {
           min-width: 235px;
           max-width: 235px;
           width: 235px;
           font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
           position: relative;
           overflow: hidden;
           border-radius: 0;
           box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
           background: #ffffff;
           animation: modalSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
         }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .modal-backdrop {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg,
            rgba(255, 255, 255, 0.98) 0%,
            rgba(248, 250, 255, 0.98) 25%,
            rgba(240, 245, 255, 0.98) 50%,
            rgba(235, 242, 255, 0.98) 75%,
            rgba(230, 240, 255, 0.98) 100%);
          z-index: 1;
        }

        .modal-content1 {
          position: relative;
          z-index: 2;
          padding: 0px;
          background: transparent;
        }
         .modal-header1 {
           display: flex;
           align-items: center;
           gap: 12px;
           padding: 10px;
           background: #f9fafb;
           border-bottom: 1px solid #e5e7eb;
         }

         .profile-left {
           flex-shrink: 0;
           display: flex;
           flex-direction: column;
           align-items: center;
           justify-content: center;
         }

         .profile-right {
           flex-shrink: 0;
           display: flex;
           flex-direction: column;
           align-items: center;
           justify-content: center;
         }

         .user-info-section {
           width: 100%;
           display: flex;
           flex-direction: column;
           justify-content: center;
         }

         .user-avatar {
           width: 60px;
           height: 60px;
           border-radius: 50%;
           object-fit: cover;
           border: 2px solid #ffffff;
           box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
         }

         .user-name-row, .user-phone-row, .user-location-row {
           display: flex;
           align-items: flex-start;
           gap: 6px;
           margin-bottom: 4px;
         }

         .user-icon, .phone-icon, .location-icon {
           color: #6b7280;
           flex-shrink: 0;
         }

         .user-name {
           margin: 0;
           font-size: 14px;
           font-weight: 700;
           color: #1f2937;
           white-space: normal;
           word-wrap: break-word;
           word-break: break-word;
           max-width: 160px;
           line-height: 1.3;
         }

         .user-phone {
           margin: 0;
           font-size: 12px;
           color: #4b5563;
           white-space: normal;
           word-wrap: break-word;
           word-break: break-word;
           max-width: 160px;
           line-height: 1.3;
         }

         .location-text {
           font-size: 12px;
           color: #4b5563;
           white-space: normal;
           word-wrap: break-word;
           word-break: break-word;
           max-width: 160px;
           line-height: 1.3;
         }



        /* Hide Google Maps default close button */
        .gm-style-iw-chr {
          display: none !important;
        }

        /* Remove padding from Google Maps elements */
        .gm-style {
          padding: 0 !important;
        }

         .gm-style-iw-c {
           padding: 0 !important;
           max-width: 235px !important;
           overflow: hidden !important;
         }

         .gm-style-iw-d {
           overflow: hidden !important;
           max-width: 235px !important;
         }

        /* Ensure no scrollbars appear */
        .gm-style-iw {
          overflow: hidden !important;
        }

        .modern-match-button {
          position: relative;
          width: 100%;
          border: none;
          border-radius: 16px;
          padding: 0;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 6px 20px rgba(74, 193, 224, 0.4);
          animation: buttonPulse 2s ease-in-out infinite alternate;
        }

        .modern-match-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 16px 40px rgba(74, 193, 224, 0.5);
          animation: none;
        }

        .modern-match-button:active {
          transform: translateY(-1px);
        }

        @keyframes buttonPulse {
          from {
            box-shadow: 0 6px 20px rgba(74, 193, 224, 0.4);
          }
          to {
            box-shadow: 0 8px 28px rgba(74, 193, 224, 0.6);
          }
        }

        .button-gradient {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, #00C194 0%, #f54d6a 100%);
          z-index: 1;
        }

        .button-content {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 20px;
          color: white;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: -0.3px;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        .button-icon {
          font-size: 20px;
        }

        .button-text {
          font-weight: 700;
        }

        .sophisticated-modal.current-user-modal .modal-header {
          background: linear-gradient(135deg,
            rgba(74, 193, 224, 0.1) 0%,
            rgba(245, 77, 106, 0.1) 100%);
        }

        .sophisticated-modal.current-user-modal .avatar-ring {
          background: linear-gradient(135deg, #00C194 0%, #f54d6a 100%);
        }
      </style>
    `;
  }

  updateUserMarker(userId, newPosition, userData) {
    const marker = this.markers.get(userId);
    if (marker) {
      const position = {
        lat: newPosition.coordinates[1],
        lng: newPosition.coordinates[0],
      };
      marker.setPosition(position);

      const infoWindow = this.infoWindows.get(userId);
      if (infoWindow && userData) {
        infoWindow.setContent(this.createInfoWindowContent(userData));
      }
    }
  }

  removeUserMarker(userId) {
    const marker = this.markers.get(userId);
    const infoWindow = this.infoWindows.get(userId);

    if (marker) {
      marker.setMap(null);
      this.markers.delete(userId);
    }

    if (infoWindow) {
      infoWindow.close();
      this.infoWindows.delete(userId);
    }
  }

  clearAllUserMarkers() {
    this.markers.forEach((marker, userId) => {
      // Preserve current-user and meeting-related user markers
      if (
        !userId.includes("current-user") &&
        !userId.includes("meeting-current-user") &&
        !userId.includes("meeting-target-user")
      ) {
        marker.setMap(null);
      }
    });
    this.infoWindows.forEach((infoWindow, userId) => {
      // Preserve current-user and meeting-related user markers
      if (
        !userId.includes("current-user") &&
        !userId.includes("meeting-current-user") &&
        !userId.includes("meeting-target-user")
      ) {
        infoWindow.close();
      }
    });

    // Keep current user, meeting current user, and meeting target user markers
    const preserveMarkers = new Map();
    const preserveWindows = new Map();

    ["current-user", "meeting-current-user", "meeting-target-user"].forEach(
      (key) => {
        const marker = this.markers.get(key);
        const window = this.infoWindows.get(key);
        if (marker) {
          preserveMarkers.set(key, marker);
        }
        if (window) {
          preserveWindows.set(key, window);
        }
      }
    );

    this.markers.clear();
    this.infoWindows.clear();

    // Restore preserved markers
    preserveMarkers.forEach((marker, key) => {
      this.markers.set(key, marker);
    });
    preserveWindows.forEach((window, key) => {
      this.infoWindows.set(key, window);
    });
  }

  centerOnLocation(location, zoom = 15) {
    if (this.map && location) {
      this.map.setCenter(location);
      this.map.setZoom(zoom);
    }
  }

  fitMapToShowAllUsers(users, currentLocation) {
    if (!this.map || !this.google || users.length === 0) return;

    const bounds = new this.google.maps.LatLngBounds();

    // Include current location
    if (currentLocation) {
      bounds.extend(
        new this.google.maps.LatLng(currentLocation.lat, currentLocation.lng)
      );
    }

    // Include all user locations
    users.forEach((user) => {
      if (user.location && user.location.coordinates) {
        bounds.extend(
          new this.google.maps.LatLng(
            user.location.coordinates[1],
            user.location.coordinates[0]
          )
        );
      }
    });

    this.map.fitBounds(bounds);

    // Add some padding and ensure minimum zoom level
    setTimeout(() => {
      if (this.map.getZoom() > 15) {
        this.map.setZoom(15);
      }
    }, 100);
  }

  // Set map to show 100km area centered on user location
  setMapTo100kmView(userLocation) {
    if (!this.map || !this.google || !userLocation) return;

    // Center on user location
    this.map.setCenter(new this.google.maps.LatLng(userLocation.lat, userLocation.lng));

    // Set zoom level to show approximately 100km area
    // Zoom level 8 typically shows about 100km radius
    this.map.setZoom(8);
  }

  // Set map to show both users with appropriate zoom and slight upward offset
  setMapToShowTwoUsers(currentUserLocation, selectedUserLocation) {
    if (!this.map || !this.google || !currentUserLocation || !selectedUserLocation) return;

    const bounds = new this.google.maps.LatLngBounds();

    // Include both user locations
    bounds.extend(new this.google.maps.LatLng(currentUserLocation.lat, currentUserLocation.lng));
    bounds.extend(new this.google.maps.LatLng(selectedUserLocation.lat, selectedUserLocation.lng));

    // Desktop vs mobile padding - account for left sidebar modal on PC
    const isDesktop = typeof window !== 'undefined' ? window.matchMedia('(min-width: 769px)').matches : false;
    const padding = isDesktop
      ? { top: 100, right: 80, bottom: 120, left: 400 } // Increased left padding for sidebar modal
      : { top: 140, right: 40, bottom: 260, left: 40 };

    // Fit bounds so both users are visible with appropriate padding
    try {
      if (typeof this.map.fitBounds === 'function') {
        this.map.fitBounds(bounds, padding);
      } else {
        // Fallback: manually set center and a reasonable zoom
        const center = bounds.getCenter();
        if (center) {
          this.map.panTo(center);
        }
        this.map.setZoom(isDesktop ? 15 : 13);
        return;
      }

      // After fitting, cap the zoom so it's close enough but not too far
      const maxZoomDesktop = 14; // Reduced from 17 to prevent over-zooming
      const maxZoomMobile = 18;
      const maxZoom = isDesktop ? maxZoomDesktop : maxZoomMobile;

      const idleListener = this.google.maps.event.addListener(this.map, 'idle', () => {
        try {
          const currentZoom = this.map.getZoom();
          if (currentZoom && currentZoom < maxZoom) {
            // No change needed if already farther out than cap
          } else if (currentZoom && currentZoom > maxZoom) {
            this.map.setZoom(maxZoom);
          }
        } finally {
          this.google.maps.event.removeListener(idleListener);
        }
      });
    } catch (e) {
      console.warn('fitBounds failed, falling back to pan/zoom:', e);
      const center = bounds.getCenter();
      if (center) {
        this.map.panTo(center);
      }
      this.map.setZoom(isDesktop ? 16 : 14);
    }
  }

  async closeAllInfoWindows() {
    this.infoWindows.forEach((infoWindow) => infoWindow.close());
    // Don't reset markers to normal size - keep selected marker in selected state
    // await this.resetAllMarkersToNormalSize();
  }

  async resetAllMarkersToNormalSize() {
    const promises = [];
    this.markers.forEach((marker) => {
      if (marker.userData) {
        const { avatarUrl, markerSize, isCurrentUser, user } = marker.userData;
        const gender = user?.gender || 'male'; // Default to 'male' if gender is undefined
        const promise = this.createAvatarMarkerIcon(avatarUrl, markerSize, false, isCurrentUser, gender)
          .then(normalIcon => {
            marker.setIcon(normalIcon);
          });
        promises.push(promise);
      }
    });
    await Promise.all(promises);
  }

  async calculateRoute(origin, destination) {
    if (!this.directionsService) {
      throw new Error("Directions service not initialized");
    }

    return new Promise((resolve, reject) => {
      this.directionsService.route(
        {
          origin,
          destination,
          travelMode: this.google.maps.TravelMode.WALKING,
        },
        (result, status) => {
          if (status === "OK") {
            resolve(result);
          } else {
            reject(new Error(`Directions request failed: ${status}`));
          }
        }
      );
    });
  }

  displayRoute(directionsResult) {
    if (!this.directionsRenderer) {
      throw new Error("Directions renderer not initialized");
    }

    this.directionsRenderer.setDirections(directionsResult);
  }

  clearRoute() {
    if (this.directionsRenderer) {
      this.directionsRenderer.setDirections({ routes: [] });
    }
  }

  createMeetingPointMarker(position, meetingInfo) {
    const icon = {
      url: "/icons/meeting-point.png",
      scaledSize: new this.google.maps.Size(50, 50),
      anchor: new this.google.maps.Point(25, 50),
    };

    const marker = this.createMarker(position, {
      icon,
      title: "Meeting Point",
      zIndex: 500,
    });

    const infoWindow = new this.google.maps.InfoWindow({
      content: `
        <div class="meeting-point-info">
          <h3>🎯 Meeting Point</h3>
          <p>${meetingInfo.address || "Custom location"}</p>
          <p><strong>Reason:</strong> ${meetingInfo.reason}</p>
          ${meetingInfo.scheduledTime
          ? `<p><strong>Time:</strong> ${new Date(
            meetingInfo.scheduledTime
          ).toLocaleString()}</p>`
          : ""
        }
          <div class="meeting-actions">
            <button onclick="window.dispatchEvent(new CustomEvent('getDirections', {detail: {lat: ${position.lat
        }, lng: ${position.lng}}}))">
              Get Directions
            </button>
            <button onclick="window.dispatchEvent(new CustomEvent('confirmMeeting', {detail: {meetingId: '${meetingInfo.meetingId
        }'}}))">
              I'm Here
            </button>
          </div>
        </div>
      `,
    });

    marker.addListener("click", () => {
      this.closeAllInfoWindows();
      infoWindow.open(this.map, marker);
    });

    return marker;
  }

  async findNearbyPlaces(location, type = "restaurant") {
    if (!this.google) {
      throw new Error("Google Maps not initialized");
    }

    const service = new this.google.maps.places.PlacesService(this.map);

    return new Promise((resolve, reject) => {
      service.nearbySearch(
        {
          location,
          radius: 1000,
          type,
        },
        (results, status) => {
          if (status === this.google.maps.places.PlacesServiceStatus.OK) {
            resolve(results);
          } else {
            reject(new Error(`Places search failed: ${status}`));
          }
        }
      );
    });
  }

  centerOnLocation(position, zoom = 15) {
    if (this.map) {
      this.map.setCenter(position);
      this.map.setZoom(zoom);
    }
  }

  updateCurrentUserLocation(userId, newLocation) {
    // Remove existing marker for current user
    this.removeUserMarker(userId);

    // Create new marker at updated location
    const user = {
      id: userId,
      name: "You",
      location: {
        coordinates: [newLocation.lng, newLocation.lat],
      },
    };

    this.createUserMarker(user, true);
    this.centerOnLocation(newLocation, 15);
  }

  fitBounds(bounds) {
    if (this.map) {
      this.map.fitBounds(bounds);
    }
  }

  getBounds() {
    return this.map ? this.map.getBounds() : null;
  }

  addClickListener(callback) {
    if (this.map) {
      this.map.addListener("click", callback);
    }
  }

  addIdleListener(callback) {
    if (this.map) {
      this.map.addListener("idle", callback);
    }
  }
}

export default new GoogleMapsService();
