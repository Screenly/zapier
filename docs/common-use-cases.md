# Common Use Cases

## 1. Automated Content Updates

- Connect Dropbox/Google Drive/SharePoint
- New files automatically appear on screens
- Perfect for marketing teams

## 2. Scheduled Displays

- Show content during specific times
- Automate weekly/monthly updates
- Event-based content management

## 3. Multi-Screen Management

- Different content for different locations
- Department-specific displays
- Emergency broadcast system

## 4. Content Library Management

- Automatic file organization
- Scheduled content rotation
- Cleanup old content

## 5. Weather-Based Dynamic Content

### Example: Smart Weather-Driven Displays

- Use Weather API as trigger (hourly check)
- **Temperature-Based Content:**
  - When temperature > 20°C:
    - Enable "Summer Treats" playlist (ice cream, cold drinks)
    - Disable "Winter Warmers" playlist
  - When temperature < 0°C:
    - Enable "Winter Warmers" playlist (hot chocolate, soups)
    - Disable "Summer Treats" playlist
- **Rain-Based Content:**
  - When it's raining:
    - Enable "Rainy Day Specials" playlist (umbrellas, raincoats)
    - Show "Stay Dry" promotions
  - When rain stops:
    - Return to default seasonal playlist
    - Disable rain-specific promotions

### Setup Steps:
1. Create weather-specific playlists in Screenly:
   - "Summer Treats" - cold items
   - "Winter Warmers" - hot items
   - "Rainy Day Specials" - weather protection items
2. In Zapier:
   - Trigger: Weather by Zapier (check every hour)
   - Filter 1: Temperature conditions
   - Filter 2: Precipitation conditions
   - Actions:
     - Enable/Disable appropriate playlists
     - Update content based on current conditions

### Benefits:

- Automatically adapt to multiple weather conditions
- Increase sales with contextual promotions
- Show relevant products at the right time
- Create urgency with weather-specific offers
- No manual playlist management needed