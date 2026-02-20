# Twilio SMS Verification Setup for Production

## Overview
This guide will help you set up Twilio SMS verification for the production environment of the matching app backend.

## Prerequisites
1. Node.js environment set to production (`NODE_ENV=production`)
2. Twilio account (sign up at https://www.twilio.com)
3. Verified phone number or upgraded Twilio account for sending SMS

## Step 1: Create Twilio Account
1. Go to https://www.twilio.com and sign up for an account
2. Verify your email and phone number
3. Complete the account setup process

## Step 2: Get Twilio Credentials
1. Navigate to the Twilio Console: https://console.twilio.com
2. From the dashboard, locate and copy:
   - **Account SID**: Found on the main dashboard (starts with `AC`)
   - **Auth Token**: Click to reveal and copy (keep this secret!)

## Step 3: Get a Twilio Phone Number
1. In the Twilio Console, go to **Phone Numbers** → **Manage** → **Buy a Number**
2. Choose a phone number with SMS capabilities
3. Purchase the number (free trial includes credit)
4. Copy the phone number (format: `+1234567890`)

## Step 4: Configure Environment Variables
Create or update your `.env` file with the following:

```env
# Environment
NODE_ENV=production

# Twilio Configuration (Required for SMS in production)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890

# Other required configurations
MONGODB_URI=your-production-mongodb-uri
JWT_SECRET=your-secure-jwt-secret
PORT=5000
CLIENT_URL=https://your-frontend-domain.com
```

## Step 5: Verify Phone Number Format
Ensure all phone numbers in your application use international format:
- ✅ Correct: `+14155552671` (with country code)
- ❌ Wrong: `4155552671` (without country code)
- ❌ Wrong: `(415) 555-2671` (formatted)

## Step 6: Test the Configuration
1. Start your server in production mode:
   ```bash
   NODE_ENV=production npm start
   ```

2. Monitor the console output:
   - ✅ You should see: `✅ Twilio client initialized successfully`
   - ❌ If you see errors, check your credentials

3. Test registration/login flow:
   - Register a new user with a valid phone number
   - Check console logs for SMS sending status
   - Verify the SMS is received on the phone

## Step 7: Production Considerations

### Rate Limiting
The application includes SMS rate limiting (configured in .env):
```env
SMS_RATE_LIMIT_WINDOW=60    # Window in minutes
SMS_RATE_LIMIT_MAX=5         # Max SMS per window
```

### Error Handling
The updated code includes:
- Proper error messages for invalid credentials
- Phone number format validation
- Graceful fallback for configuration issues
- Detailed logging for debugging

### Security Best Practices
1. **Never commit `.env` file** to version control
2. **Use environment variables** in your hosting platform
3. **Rotate Auth Token** periodically
4. **Monitor usage** through Twilio Console
5. **Set up alerts** for unusual activity

## Step 8: Deployment Platforms

### Heroku
```bash
heroku config:set NODE_ENV=production
heroku config:set TWILIO_ACCOUNT_SID=ACxxxxx
heroku config:set TWILIO_AUTH_TOKEN=xxxxxx
heroku config:set TWILIO_PHONE_NUMBER=+1234567890
```

### AWS/Digital Ocean/VPS
Add to your systemd service file or PM2 ecosystem file:
```javascript
// ecosystem.config.js for PM2
module.exports = {
  apps: [{
    name: 'matching-app',
    script: './server.js',
    env: {
      NODE_ENV: 'production',
      TWILIO_ACCOUNT_SID: 'ACxxxxx',
      TWILIO_AUTH_TOKEN: 'xxxxxx',
      TWILIO_PHONE_NUMBER: '+1234567890'
    }
  }]
}
```

### Docker
```dockerfile
ENV NODE_ENV=production
ENV TWILIO_ACCOUNT_SID=ACxxxxx
ENV TWILIO_AUTH_TOKEN=xxxxxx
ENV TWILIO_PHONE_NUMBER=+1234567890
```

## Troubleshooting

### Common Issues and Solutions

1. **"Twilio client not initialized"**
   - Check `NODE_ENV` is set to `production`
   - Verify `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` are set
   - Ensure credentials are correct (no extra spaces)

2. **"Invalid phone number format"**
   - Use international format: `+[country_code][number]`
   - Remove any spaces, parentheses, or dashes
   - Example: `+14155552671`

3. **"Invalid Twilio credentials"**
   - Double-check Account SID and Auth Token
   - Ensure no typos or missing characters
   - Verify account is active and not suspended

4. **SMS not received**
   - Check Twilio Console for message logs
   - Verify recipient number is correct
   - For trial accounts, ensure number is verified
   - Check geographic permissions in Twilio settings

5. **Rate limit exceeded**
   - Adjust `SMS_RATE_LIMIT_MAX` in environment variables
   - Implement additional spam prevention measures
   - Consider upgrading Twilio account for higher limits

## Testing in Development
To test in development mode without sending real SMS:
```env
NODE_ENV=development
```
The application will log verification codes to console instead of sending SMS.

## Monitoring
1. **Twilio Console**: Monitor usage, errors, and logs at https://console.twilio.com
2. **Application Logs**: Check server logs for SMS status messages
3. **Error Tracking**: Consider integrating error tracking (Sentry, Rollbar)

## Support
- Twilio Documentation: https://www.twilio.com/docs/sms
- Twilio Support: https://www.twilio.com/help/contact
- Application Issues: Check server logs and Twilio Console for details

## Cost Considerations
- Trial account includes free credits
- SMS pricing varies by country (check Twilio pricing page)
- Consider implementing:
  - Daily/monthly SMS limits per user
  - CAPTCHA for additional protection
  - Alternative verification methods (email)