# Map API Documentation

## Overview
The MatchApp backend now provides comprehensive map functionality to display users on a map with real-time location updates. The map system supports geolocation, nearby user discovery, and interactive map features.

## API Endpoints

### 1. **Get Map Configuration**
```
GET /api/map/config
```
**Authentication**: Not required
**Purpose**: Get map settings and configuration

**Response**:
```json
{
  "success": true,
  "config": {
    "defaultCenter": {
      "lat": 35.6762,
      "lng": 139.6503
    },
    "defaultZoom": 12,
    "maxRadius": 200000,
    "minRadius": 1000,
    "markerStyles": {
      "male": {
        "color": "#4A90E2",
        "icon": "👨",
        "size": "medium"
      },
      "female": {
        "color": "#E24A90",
        "icon": "👩",
        "size": "medium"
      },
      "other": {
        "color": "#50C878",
        "icon": "🧑",
        "size": "medium"
      }
    },
    "mapSettings": {
      "showTraffic": false,
      "showTransit": false,
      "enableClustering": true,
      "clusterRadius": 50,
      "maxClusterRadius": 100
    },
    "radiusOptions": [
      { "label": "1km", "value": 1000 },
      { "label": "5km", "value": 5000 },
      { "label": "10km", "value": 10000 },
      { "label": "25km", "value": 25000 },
      { "label": "50km", "value": 50000 },
      { "label": "100km", "value": 100000 }
    ]
  },
  "message": "マップ設定を取得しました"
}
```

### 2. **Get Map Data with Nearby Users**
```
GET /api/map/data?lat={latitude}&lng={longitude}&radius={radius}
```
**Authentication**: Required (Bearer token)
**Purpose**: Get nearby users for map display

**Query Parameters**:
- `lat` (required): Latitude (-90 to 90)
- `lng` (required): Longitude (-180 to 180)
- `radius` (optional): Search radius in meters (1000-200000, default: 50000)

**Response**:
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "507f1f77bcf86cd799439011",
        "name": "田中太郎",
        "gender": "male",
        "profilePhoto": "https://randomuser.me/api/portraits/men/1.jpg",
        "bio": "こんにちは！よろしくお願いします！",
        "location": {
          "lat": 35.6762,
          "lng": 139.6503
        },
        "distance": 1250,
        "isOnline": true,
        "lastSeen": "2024-01-15T10:30:00.000Z",
        "matchCount": 5,
        "marker": {
          "color": "#4A90E2",
          "icon": "male",
          "size": "large"
        }
      }
    ],
    "center": {
      "lat": 35.6762,
      "lng": 139.6503
    },
    "radius": 50000,
    "count": 15
  },
  "message": "15人のユーザーが見つかりました"
}
```

### 3. **Get Current User Location**
```
GET /api/map/location
```
**Authentication**: Required (Bearer token)
**Purpose**: Get current user's location for map centering

**Response**:
```json
{
  "success": true,
  "location": {
    "lat": 35.6762,
    "lng": 139.6503,
    "address": "Tokyo, Japan"
  },
  "message": "現在地を取得しました"
}
```

**Error Response** (with fallback):
```json
{
  "success": false,
  "error": "現在地の取得でエラーが発生しました",
  "fallback": {
    "lat": 35.6762,
    "lng": 139.6503,
    "address": "Tokyo, Japan"
  }
}
```

### 4. **Update User Location from Map**
```
POST /api/map/location
```
**Authentication**: Required (Bearer token)
**Purpose**: Update user's location when they move on the map

**Request Body**:
```json
{
  "lat": 35.6762,
  "lng": 139.6503,
  "address": "Tokyo, Japan"
}
```

**Response**:
```json
{
  "success": true,
  "location": {
    "lat": 35.6762,
    "lng": 139.6503,
    "address": "Tokyo, Japan"
  },
  "message": "位置情報を更新しました"
}
```

## Frontend Implementation Guide

### 1. **Initialize Map**
```javascript
// Get map configuration
const initializeMap = async () => {
  try {
    const configResponse = await fetch('/api/map/config');
    const { config } = await configResponse.json();

    // Initialize map with config
    const map = new google.maps.Map(document.getElementById('map'), {
      center: config.defaultCenter,
      zoom: config.defaultZoom,
      styles: getMapStyles() // Your custom map styles
    });

    return { map, config };
  } catch (error) {
    console.error('Map initialization error:', error);
  }
};
```

### 2. **Get User's Current Location**
```javascript
const getCurrentLocation = async () => {
  try {
    // Try to get saved location from server
    const response = await fetch('/api/map/location', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    });

    const data = await response.json();

    if (data.success) {
      return data.location;
    } else {
      // Use fallback location
      return data.fallback;
    }
  } catch (error) {
    // Fallback to browser geolocation
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          // Ultimate fallback to Tokyo
          resolve({ lat: 35.6762, lng: 139.6503 });
        }
      );
    });
  }
};
```

### 3. **Load Nearby Users on Map**
```javascript
const loadNearbyUsers = async (map, lat, lng, radius = 50000) => {
  try {
    const response = await fetch(
      `/api/map/data?lat=${lat}&lng=${lng}&radius=${radius}`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      }
    );

    const data = await response.json();

    if (data.success) {
      // Clear existing markers
      clearMarkers();

      // Add user markers to map
      data.data.users.forEach(user => {
        addUserMarker(map, user);
      });

      // Update user count display
      document.getElementById('userCount').textContent =
        `${data.data.count}人のユーザーが見つかりました`;
    }
  } catch (error) {
    console.error('Load users error:', error);
  }
};
```

### 4. **Add User Markers**
```javascript
const addUserMarker = (map, user) => {
  const marker = new google.maps.Marker({
    position: { lat: user.location.lat, lng: user.location.lng },
    map: map,
    title: user.name,
    icon: {
      url: createMarkerIcon(user.marker.color, user.marker.icon),
      scaledSize: new google.maps.Size(40, 40)
    }
  });

  // Add info window
  const infoWindow = new google.maps.InfoWindow({
    content: createInfoWindowContent(user)
  });

  marker.addListener('click', () => {
    infoWindow.open(map, marker);
  });

  return marker;
};

const createInfoWindowContent = (user) => {
  return `
    <div class="user-info">
      <img src="${user.profilePhoto}" alt="${user.name}" class="profile-photo">
      <h3>${user.name}</h3>
      <p>${user.bio}</p>
      <div class="user-stats">
        <span>距離: ${user.distance}m</span>
        <span>マッチ数: ${user.matchCount}</span>
        <span class="${user.isOnline ? 'online' : 'offline'}">
          ${user.isOnline ? 'オンライン' : 'オフライン'}
        </span>
      </div>
      <button onclick="sendMatchRequest('${user.id}')" class="match-btn">
        マッチリクエストを送信
      </button>
    </div>
  `;
};
```

### 5. **Real-time Updates with Socket.IO**
```javascript
// Listen for location updates
socket.on('userLocationUpdate', (data) => {
  const { userId, location } = data;

  // Update marker position if user is visible on map
  const marker = findMarkerByUserId(userId);
  if (marker) {
    marker.setPosition(new google.maps.LatLng(location.lat, location.lng));
  }
});

// Update own location
const updateMyLocation = async (lat, lng) => {
  try {
    const response = await fetch('/api/map/location', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      },
      body: JSON.stringify({ lat, lng })
    });

    const data = await response.json();

    if (data.success) {
      console.log('Location updated successfully');
      // Refresh nearby users
      loadNearbyUsers(map, lat, lng);
    }
  } catch (error) {
    console.error('Location update error:', error);
  }
};
```

## Map Features

### **Marker Styles**
- **Male users**: Blue markers (👨)
- **Female users**: Pink markers (👩)
- **Other**: Green markers (🧑)
- **Online users**: Larger, brighter markers
- **Offline users**: Smaller, dimmed markers

### **Interactive Features**
- Click markers to see user info
- Send match requests directly from map
- Real-time location updates
- Distance calculations
- Radius adjustment (1km - 100km)

### **Performance Features**
- **Marker clustering**: Groups nearby markers
- **Lazy loading**: Load users as needed
- **Location caching**: Reduce API calls
- **Real-time updates**: Socket.IO integration

## Error Handling

All map endpoints return consistent error responses:
```json
{
  "success": false,
  "error": "エラーメッセージ（日本語）",
  "fallback": {
    // Fallback data when applicable
  }
}
```

## Console Logging

Map operations are logged for debugging:
```
🗺️ Fetching map data for 田中太郎
📍 Center: [139.6503, 35.6762], Radius: 50000m
📊 Found 15 users for map display
📍 Updating location for user 507f1f77bcf86cd799439011: [139.6503, 35.6762]
✅ Location updated for 田中太郎
```

The map functionality is now fully enabled with comprehensive API endpoints, real-time updates, and detailed error handling!