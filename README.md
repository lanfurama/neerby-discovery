<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1MxZufrwlyhDttA5B-tRftdBSYVmW445C

## Run Locally

**Prerequisites:**  Node.js

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local` file in the root directory with your API keys:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
   ```

3. Get your API keys:
   - **Gemini API Key**: Get it from [Google AI Studio](https://aistudio.google.com/app/apikey)
   - **Google Places API Key**: 
     1. Go to [Google Cloud Console](https://console.cloud.google.com/)
     2. Create a new project or select existing one
     3. Enable "Places API" and "Places API (New)"
     4. Create credentials (API Key)
     5. Restrict the API key to Places API for security

4. Run the app:
   ```bash
   npm run dev
   ```

### Features

This app aggregates restaurant data from multiple sources:

- **Google Places API**: Provides accurate restaurant information including:
  - Name, address, phone number, website
  - Ratings and reviews
  - Photos
  - Opening hours
  - Price level

- **Gemini AI with Google Search**: Enhances data with:
  - Menu highlights and popular dishes
  - Business descriptions
  - Email addresses (when available)
  - Additional insights from web search

- **GrabFood & ShopeeFood**: 
  - Search links to delivery platforms
  - Platform availability detection
  - (Note: Full scraping requires additional setup)

### Architecture

- `services/googlePlacesService.ts` - Fetches restaurant data from Google Places API
- `services/geminiService.ts` - Uses Gemini AI with Google Search for additional insights
- `services/grabFoodService.ts` - Searches GrabFood platform
- `services/shopeeFoodService.ts` - Searches ShopeeFood platform
- `services/restaurantDataService.ts` - Main service that aggregates all data sources
