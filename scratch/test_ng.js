import { locationService } from '../src/services/location/locationService.js';

async function testNigeria() {
  const queries = ['Jabi Lake', 'Jabi, Abuja', 'Central Park, Abuja', 'Maitama, Abuja', 'Abuja, Nigeria'];
  for (const q of queries) {
    const res = await locationService.searchWorldwideLocations(q);
    console.log(`Query: "${q}" -> ${res.length} results`);
    if (res.length > 0) {
      console.log('Sample:', res[0].placeName, '|', res[0].city, '|', res[0].country, '|', res[0].latitude, res[0].longitude);
    }
  }
}
testNigeria();
