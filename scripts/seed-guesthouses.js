/**
 * Seed script to populate Firestore with sample guesthouse data
 *
 * Usage:
 * 1. Make sure you have a .env file with Firebase credentials
 * 2. Run: npm install firebase
 * 3. Run: node scripts/seed-guesthouses.js
 *
 * Note: You must be authenticated as an admin for this to work
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample guesthouse data
const sampleGuesthouses = [
  {
    name: 'Thamalakane River Lodge',
    logoUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
    galleryUrls: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800',
      'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800',
    ],
    description: 'Nestled along the serene Thamalakane River, this lodge offers a tranquil escape with stunning river views. Perfect for nature lovers seeking an authentic Botswana experience with modern comforts.',
    amenities: ['WiFi', 'Swimming Pool', 'Restaurant', 'Bar', 'Game Drives', 'Boat Trips'],
    location: {
      lat: -19.9858,
      lng: 23.4166,
    },
    pricePerNight: 1100,
    city: 'Maun',
    country: 'Botswana',
    contact: {
      phone: '+267 686 0022',
      email: 'info@thamalakane.co.bw',
      address: 'Boro Riverbank, Maun, Botswana',
    },
    numberOfRooms: 18,
    checkInTime: '14:00',
    houseRules: 'No smoking indoors. Pets allowed with prior notice. Quiet hours after 22:00.',
  },
  {
    name: 'The Acacia Urban Guesthouse',
    logoUrl: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400',
    galleryUrls: [
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800',
    ],
    description: 'Modern urban retreat in the heart of Phakalane, offering stylish accommodation with easy access to Gaborone\'s attractions. Features contemporary design and all modern amenities.',
    amenities: ['WiFi', 'Air Conditioning', 'Parking', 'Breakfast Included', 'Conference Room'],
    location: {
      lat: -24.5792,
      lng: 25.9231,
    },
    pricePerNight: 750,
    city: 'Gaborone',
    country: 'Botswana',
    contact: {
      phone: '+267 391 2345',
      email: 'reservations@acaciaguesthouse.co.bw',
      address: 'Plot 123, Phakalane, Gaborone',
    },
    numberOfRooms: 12,
    checkInTime: '13:00',
    houseRules: 'No smoking. No pets. Children welcome.',
  },
  {
    name: 'Chobe Riverside Retreat',
    logoUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400',
    galleryUrls: [
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
      'https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=800',
    ],
    description: 'Experience the majesty of the Chobe River with breathtaking views and abundant wildlife. Our riverside location offers front-row seats to nature\'s greatest show.',
    amenities: ['WiFi', 'Pool', 'Restaurant', 'Safari Tours', 'Sunset Cruises', 'Spa'],
    location: {
      lat: -17.7948,
      lng: 25.1631,
    },
    pricePerNight: 950,
    city: 'Kasane',
    country: 'Botswana',
    contact: {
      phone: '+267 625 0088',
      email: 'stay@choberiverside.co.bw',
      address: 'Riverfront Road, Kasane, Botswana',
    },
    numberOfRooms: 24,
    checkInTime: '14:00',
    houseRules: 'No smoking in rooms. Pets not allowed. Minimum 2-night stay during peak season.',
  },
  {
    name: 'Kalahari Sands Suite',
    logoUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400',
    galleryUrls: [
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800',
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800',
      'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800',
    ],
    description: 'Comfortable and affordable accommodation in Francistown. Perfect for business travelers and tourists exploring the eastern region of Botswana.',
    amenities: ['WiFi', 'Parking', 'Air Conditioning', 'Breakfast', 'Laundry Service'],
    location: {
      lat: -21.1671,
      lng: 27.5146,
    },
    pricePerNight: 580,
    city: 'Francistown',
    country: 'Botswana',
    contact: {
      phone: '+267 241 7890',
      email: 'info@kalaharisands.co.bw',
      address: 'Blue Jacket Street, Francistown',
    },
    numberOfRooms: 15,
    checkInTime: '12:00',
    houseRules: 'No smoking. Small pets allowed with deposit. Early check-in available on request.',
  },
  {
    name: 'Tswapong Hills Eco-Stay',
    logoUrl: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400',
    galleryUrls: [
      'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800',
      'https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=800',
      'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800',
    ],
    description: 'Eco-friendly guesthouse near the stunning Tswapong Hills and Moremi Gorge. Ideal base for hiking and exploring the natural beauty of central Botswana.',
    amenities: ['WiFi', 'Eco-Friendly', 'Hiking Trails', 'Bird Watching', 'Solar Power'],
    location: {
      lat: -22.5501,
      lng: 26.8042,
    },
    pricePerNight: 420,
    city: 'Palapye',
    country: 'Botswana',
    contact: {
      phone: '+267 492 1234',
      email: 'bookings@tswapongeco.co.bw',
      address: 'Near Moremi Gorge, Palapye',
    },
    numberOfRooms: 8,
    checkInTime: '13:00',
    houseRules: 'No smoking. Pets not allowed. Please respect our eco-friendly practices.',
  },
];

async function seedGuesthouses() {
  console.log('🌱 Starting to seed guesthouses...\n');

  // You'll need to replace this with an actual admin UID from your Firebase project
  const adminUid = 'BOOTSTRAP_ADMIN_UID';

  console.log('⚠️  NOTE: Make sure you have created the first admin user in Firebase Console!');
  console.log('⚠️  Update the adminUid variable in this script with the real admin UID.\n');

  try {
    for (let i = 0; i < sampleGuesthouses.length; i++) {
      const guesthouse = sampleGuesthouses[i];

      const guesthouseData = {
        ...guesthouse,
        nameLower: guesthouse.name.toLowerCase(),
        cityLower: guesthouse.city.toLowerCase(),
        averageRating: 0,
        ratingCount: 0,
        ratingSum: 0,
        createdAt: serverTimestamp(),
        createdBy: adminUid,
      };

      const docRef = await addDoc(collection(db, 'guesthouses'), guesthouseData);

      console.log(`✅ Added: ${guesthouse.name} (ID: ${docRef.id})`);
      console.log(`   📍 ${guesthouse.city} - P${guesthouse.pricePerNight}/night\n`);
    }

    console.log('\n🎉 Successfully seeded all guesthouses!');
    console.log(`\n📊 Summary:`);
    console.log(`   Total guesthouses added: ${sampleGuesthouses.length}`);
    console.log(`   Cities covered: Maun, Gaborone, Kasane, Francistown, Palapye`);
    console.log(`   Price range: P420 - P1,100 per night\n`);
    console.log('💡 Next steps:');
    console.log('   1. Verify the data in Firebase Console');
    console.log('   2. Add some sample ratings (see seed-ratings.js)');
    console.log('   3. Test the web and mobile apps with this data\n');

  } catch (error) {
    console.error('❌ Error seeding guesthouses:', error);
    console.error('\n🔍 Possible issues:');
    console.error('   - Check your .env file has correct Firebase credentials');
    console.error('   - Make sure Firebase rules allow admin operations');
    console.error('   - Verify the admin UID is correct in this script\n');
  }

  process.exit(0);
}

// Run the seed function
seedGuesthouses();
