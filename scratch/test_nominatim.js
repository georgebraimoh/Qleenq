import { locationService } from '../src/services/location/locationService.js';

async function runTests() {
  console.log('--- TEST 1: Nigerian Location ("Jabi Lake Park, Abuja") ---');
  try {
    const res1 = await locationService.searchWorldwideLocations('Jabi Lake Park, Abuja');
    console.log(`Found ${res1.length} results:`);
    if (res1.length > 0) {
      console.log('Result 0:', JSON.stringify(res1[0], null, 2));
    }
  } catch (err) {
    console.error('Test 1 Error:', err.message);
  }

  console.log('\n--- TEST 2: Outside Nigeria ("Eiffel Tower, Paris") ---');
  try {
    const res2 = await locationService.searchWorldwideLocations('Eiffel Tower, Paris');
    console.log(`Found ${res2.length} results:`);
    if (res2.length > 0) {
      console.log('Result 0:', JSON.stringify(res2[0], null, 2));
    }
  } catch (err) {
    console.error('Test 2 Error:', err.message);
  }

  console.log('\n--- TEST 3: Famous International ("Shibuya Crossing, Tokyo") ---');
  try {
    const res3 = await locationService.searchWorldwideLocations('Shibuya Crossing, Tokyo');
    console.log(`Found ${res3.length} results:`);
    if (res3.length > 0) {
      console.log('Result 0:', JSON.stringify(res3[0], null, 2));
    }
  } catch (err) {
    console.error('Test 3 Error:', err.message);
  }

  console.log('\n--- TEST 4: No-result search ("xxyyzzqwerty123459999") ---');
  try {
    const res4 = await locationService.searchWorldwideLocations('xxyyzzqwerty123459999');
    console.log(`Found ${res4.length} results (expected 0).`);
  } catch (err) {
    console.error('Test 4 Error:', err.message);
  }

  console.log('\n--- TEST 5: Empty search ("") ---');
  try {
    const res5 = await locationService.searchWorldwideLocations('');
    console.log(`Found ${res5.length} results (expected 0).`);
  } catch (err) {
    console.error('Test 5 Error:', err.message);
  }
}

runTests();
