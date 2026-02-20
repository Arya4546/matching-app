# Database Seed Scripts

## seedUsers.js

This script creates 5 test users near your location to test the nearby users functionality.

### Customizing the Location

Before running the script, update the center coordinates in `seedUsers.js` to match your actual location:

```javascript
// Update these coordinates to your actual location
const centerLat = 37.7749; // Your latitude
const centerLng = -122.4194; // Your longitude
```

### How to find your coordinates

1. Go to Google Maps
2. Right-click on your location
3. Click "What's here?"
4. Copy the coordinates that appear

### Running the script

```bash
cd matching-app-be
node scripts/seedUsers.js
```

### What the script does

- Creates 5 test users with realistic data
- Places them randomly within a 25km radius of your center point
- Each user has:
  - Name, phone number, gender
  - Address and bio
  - Profile photo URL
  - Location coordinates
  - Online status
  - Match and meet counts

### Test Users Created

1. **Emma Johnson** - Female, Online, Hiking enthusiast
2. **Michael Chen** - Male, Online, Coffee and book lover
3. **Sophie Martinez** - Female, Offline, Yoga instructor and foodie
4. **David Wilson** - Male, Online, Musician and artist
5. **Olivia Thompson** - Female, Offline, Travel blogger and photographer

All users are SMS verified and ready to be displayed on the map.