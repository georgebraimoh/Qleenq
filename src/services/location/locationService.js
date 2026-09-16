/**
 * Location Service — Geolocation, Place Search Autocomplete & Distance Calculations
 */

// Haversine formula to calculate distance between two coordinates in kilometers
export function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // Rounded to 1 decimal place
}

// Built-in global place search database for instant autocomplete
const GLOBAL_PLACES_DB = [
  {
    placeName: "Jabi Lake Park",
    address: "Alex Ekwueme Way, Jabi",
    city: "Abuja",
    country: "Nigeria",
    countryCode: "NG",
    latitude: 9.0765,
    longitude: 7.3986
  },
  {
    placeName: "Millennium Park",
    address: "Maitama District",
    city: "Abuja",
    country: "Nigeria",
    countryCode: "NG",
    latitude: 9.0664,
    longitude: 7.4983
  },
  {
    placeName: "Wuse 2 Suya & Game Hub",
    address: "Ademola Adetokunbo Crescent",
    city: "Abuja",
    country: "Nigeria",
    countryCode: "NG",
    latitude: 9.0782,
    longitude: 7.4721
  },
  {
    placeName: "Tarkwa Bay Beach",
    address: "Victoria Island Waterfront",
    city: "Lagos",
    country: "Nigeria",
    countryCode: "NG",
    latitude: 6.4253,
    longitude: 3.4005
  },
  {
    placeName: "The Palms Shopping Mall",
    address: "Lekki-Epe Expressway, Lekki",
    city: "Lagos",
    country: "Nigeria",
    countryCode: "NG",
    latitude: 6.4357,
    longitude: 3.4478
  },
  {
    placeName: "Shoreditch High Street & Brick Lane",
    address: "Shoreditch, East London",
    city: "London",
    country: "United Kingdom",
    countryCode: "GB",
    latitude: 51.5239,
    longitude: -0.0772
  },
  {
    placeName: "Soho Vinyl & Jazz Café",
    address: "Old Compton Street, Soho",
    city: "London",
    country: "United Kingdom",
    countryCode: "GB",
    latitude: 51.5134,
    longitude: -0.1328
  },
  {
    placeName: "Brooklyn Rooftop Terrace",
    address: "Williamsburg, Brooklyn",
    city: "New York",
    country: "United States",
    countryCode: "US",
    latitude: 40.7128,
    longitude: -73.9632
  },
  {
    placeName: "Central Park Reservoir Loop",
    address: "Manhattan",
    city: "New York",
    country: "United States",
    countryCode: "US",
    latitude: 40.7851,
    longitude: -73.9683
  },
  {
    placeName: "Shibuya Crossing & Arcade Alley",
    address: "Shibuya City",
    city: "Tokyo",
    country: "Japan",
    countryCode: "JP",
    latitude: 35.6595,
    longitude: 139.7004
  },
  {
    placeName: "Kreuzberg Canal Promenade",
    address: "Paul-Lincke-Ufer",
    city: "Berlin",
    country: "Germany",
    countryCode: "DE",
    latitude: 52.4947,
    longitude: 13.4243
  },
  {
    placeName: "Labadi Pleasure Beach",
    address: "La Road, Osu Waterfront",
    city: "Accra",
    country: "Ghana",
    countryCode: "GH",
    latitude: 5.556,
    longitude: -0.1477
  },
  {
    placeName: "Westlands Art & Coffee Lounge",
    address: "Mpaka Road, Westlands",
    city: "Nairobi",
    country: "Kenya",
    countryCode: "KE",
    latitude: -1.2676,
    longitude: 36.8073
  },
  {
    placeName: "Camps Bay Beachfront",
    address: "Victoria Road, Camps Bay",
    city: "Cape Town",
    country: "South Africa",
    countryCode: "ZA",
    latitude: -33.9507,
    longitude: 18.3779
  }
];

export const locationService = {
  // Search place by query string
  searchPlaces(query) {
    if (!query || !query.trim()) return [];
    const q = query.toLowerCase().trim();

    const matches = GLOBAL_PLACES_DB.filter(p =>
      p.placeName.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q) ||
      p.country.toLowerCase().includes(q)
    );

    // If no match in DB, dynamically create a custom place object from search string
    if (matches.length === 0 && query.trim().length >= 3) {
      return [{
        placeName: query.trim(),
        address: "Custom Meeting Point",
        city: "Local Area",
        country: "Global",
        countryCode: "WO",
        latitude: 9.0765,
        longitude: 7.3986
      }];
    }

    return matches;
  },

  // Request browser geolocation coordinates safely
  getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser."));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            placeName: "Your Current Location",
            address: "Nearby Area",
            city: "Near You",
            country: "Local",
            countryCode: "LOC"
          });
        },
        (error) => {
          reject(error);
        },
        { timeout: 8000 }
      );
    });
  }
};
