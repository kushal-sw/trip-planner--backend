// Load environment variables
require('../config/env');

const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (_) {}
const mongoose = require('mongoose');
const User = require('../models/User');
const Destination = require('../models/Destination');
const Tip = require('../models/Tip');
const Trip = require('../models/Trip');
const Itinerary = require('../models/Itinerary');
const Activity = require('../models/Activity');
const Booking = require('../models/Booking');
const Expense = require('../models/Expense');
const Share = require('../models/Share');
const PhotoJournal = require('../models/PhotoJournal');

const seedData = async () => {
  try {
    console.log('🌱 Starting database seed...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB for seeding');

    // Clear existing collections
    await User.deleteMany({});
    await Destination.deleteMany({});
    await Tip.deleteMany({});
    await Trip.deleteMany({});
    await Itinerary.deleteMany({});
    await Activity.deleteMany({});
    await Booking.deleteMany({});
    await Expense.deleteMany({});
    await Share.deleteMany({});
    await PhotoJournal.deleteMany({});
    console.log('🧹 Cleaned existing database collections');

    // 1. Create Users (1 Admin, 1 Regular User)
    const adminUser = await User.create({
      name: 'Admin Master',
      email: 'admin@tripplanner.com',
      password: 'adminPassword123',
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
    });

    const regularUser = await User.create({
      name: 'Alex Explorer',
      email: 'alex@example.com',
      password: 'userPassword123',
      role: 'user',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
    });

    const companionUser = await User.create({
      name: 'Sarah Collab',
      email: 'sarah@example.com',
      password: 'sarahPassword123',
      role: 'user',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
    });

    console.log('👤 Created Users');

    // 2. Create Destinations
    const destinations = await Destination.create([
      {
        name: 'Paris',
        country: 'France',
        description: 'The City of Light, famous for world-class art, fashion, gastronomy, and culture.',
        imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34',
        popularAttractions: ['Eiffel Tower', 'Louvre Museum', 'Notre-Dame', 'Arc de Triomphe'],
        bestTimeToVisit: 'June to August, September to October',
        averageBudget: 150000,
        currency: 'EUR',
        tags: ['romantic', 'culture', 'art', 'historic'],
        partnerships: [
          { partnerName: 'Accor Hotels France', type: 'hotel', discount: '15%' },
          { partnerName: 'Air France Pass', type: 'flight', discount: '10%' },
        ],
        createdBy: adminUser._id,
      },
      {
        name: 'Kyoto',
        country: 'Japan',
        description: 'Famed for classical Buddhist temples, gardens, imperial palaces, and traditional wooden houses.',
        imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e',
        popularAttractions: ['Fushimi Inari Shrine', 'Kinkaku-ji', 'Arashiyama Bamboo Grove', 'Gion'],
        bestTimeToVisit: 'March to May (Cherry Blossoms), October to November',
        averageBudget: 130000,
        currency: 'JPY',
        tags: ['temples', 'zen', 'cherry blossoms', 'tradition'],
        partnerships: [
          { partnerName: 'Japan Rail Pass Partner', type: 'transport', discount: '12%' },
          { partnerName: 'Ryokan Collection', type: 'hotel', discount: '20%' },
        ],
        createdBy: adminUser._id,
      },
      {
        name: 'Rome',
        country: 'Italy',
        description: 'Sprawling cosmopolitan city with nearly 3,000 years of globally influential art, architecture and culture.',
        imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5',
        popularAttractions: ['Colosseum', 'Vatican Museums', 'Trevi Fountain', 'Pantheon'],
        bestTimeToVisit: 'April to May, September to October',
        averageBudget: 140000,
        currency: 'EUR',
        tags: ['ancient history', 'food', 'wine', 'architecture'],
        partnerships: [
          { partnerName: 'Roma Pass Official', type: 'attraction', discount: '25%' },
        ],
        createdBy: adminUser._id,
      },
    ]);

    console.log('📍 Created Destinations');

    // 3. Create Tips for Destinations
    const paris = destinations[0];
    const kyoto = destinations[1];
    const rome = destinations[2];

    await Tip.create([
      // Paris Tips
      { destinationId: paris._id, category: 'transport', text: 'Buy a Navigo Easy card or 10-ticket carnet for cheap Metro travel across zones 1-2.' },
      { destinationId: paris._id, category: 'safety', text: 'Beware of pickpockets around Eiffel Tower, Montmartre, and on Metro line 1.' },
      { destinationId: paris._id, category: 'food', text: 'Lunch menus (formule midi) offer high-end French cuisine at half the dinner price.' },
      { destinationId: paris._id, category: 'culture', text: 'Always say "Bonjour" when entering any shop or café — it is essential French etiquette.' },

      // Kyoto Tips
      { destinationId: kyoto._id, category: 'transport', text: 'IC cards like ICOCA or Suica work on all buses and trains in Kyoto.' },
      { destinationId: kyoto._id, category: 'culture', text: 'Do not photograph geishas without permission in Gion, and walk on designated sides.' },
      { destinationId: kyoto._id, category: 'food', text: 'Try Nishiki Market for local street food like matcha soft serve and tako tamago.' },

      // Rome Tips
      { destinationId: rome._id, category: 'culture', text: 'Cover shoulders and knees when visiting churches including St. Peter’s Basilica.' },
      { destinationId: rome._id, category: 'food', text: 'Avoid restaurants with picture menus and hosts outside near the Colosseum.' },
      { destinationId: rome._id, category: 'transport', text: 'Rome is very walkable — wear comfortable shoes for cobblestone streets.' },
    ]);

    console.log('💡 Created Tips');

    // 4. Create Sample Trip for Regular User
    const trip = await Trip.create({
      title: 'French Odyssey: Paris & Beyond',
      description: 'A 5-day cultural and culinary exploration of Paris.',
      destination: 'Paris',
      startDate: new Date('2026-07-10'),
      endDate: new Date('2026-07-14'),
      budget: 150000,
      currency: 'INR',
      status: 'planning',
      tags: ['culture', 'art', 'food'],
      coverImage: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34',
      userId: regularUser._id,
    });

    console.log('✈️  Created Sample Trip');

    // 5. Create Itineraries & Activities
    const day1 = await Itinerary.create({
      tripId: trip._id,
      dayNumber: 1,
      date: new Date('2026-07-10'),
      title: 'Arrival & Iconic Landmarks',
      notes: 'Check-in at Grand Hyatt Paris by 2:00 PM',
      transport: {
        mode: 'Metro',
        from: 'CDG Airport',
        to: 'Opera District',
        details: 'RER B to Châtelet then Metro line 7',
      },
      userId: regularUser._id,
    });

    const day2 = await Itinerary.create({
      tripId: trip._id,
      dayNumber: 2,
      date: new Date('2026-07-11'),
      title: 'Masterpieces & The Seine',
      notes: 'Pre-booked Louvre tickets at 9:30 AM',
      userId: regularUser._id,
    });

    await Activity.create([
      {
        itineraryId: day1._id,
        name: 'Ascend Eiffel Tower Summit',
        type: 'sightseeing',
        location: { name: 'Eiffel Tower', address: 'Champ de Mars, 5 Av. Anatole France' },
        startTime: '16:00',
        endTime: '18:30',
        cost: 2800,
        currency: 'INR',
        userId: regularUser._id,
      },
      {
        itineraryId: day1._id,
        name: 'Dinner at Le Café de Paris',
        type: 'food',
        location: { name: 'Le Café de Paris', address: 'Boulevard des Capucines' },
        startTime: '20:00',
        endTime: '22:00',
        cost: 3500,
        currency: 'INR',
        userId: regularUser._id,
      },
      {
        itineraryId: day2._id,
        name: 'Louvre Guided Tour',
        type: 'sightseeing',
        location: { name: 'Louvre Museum', address: 'Rue de Rivoli' },
        startTime: '09:30',
        endTime: '13:00',
        cost: 2200,
        currency: 'INR',
        userId: regularUser._id,
      },
    ]);

    console.log('📅 Created Sample Itineraries and Activities');

    // 6. Create Bookings & Expenses
    const flightBooking = await Booking.create({
      userId: regularUser._id,
      tripId: trip._id,
      type: 'flight',
      bookingRef: 'BK-FL-8219A1',
      status: 'confirmed',
      totalAmount: 12500,
      currency: 'INR',
      details: {
        airline: 'Air France',
        flightNumber: 'AF-218',
        from: 'DEL',
        to: 'CDG',
        cabinClass: 'Economy',
      },
    });

    await Expense.create({
      tripId: trip._id,
      userId: regularUser._id,
      category: 'transport',
      description: 'Booking: Air France (AF-218)',
      amount: 12500,
      currency: 'INR',
      bookingRef: flightBooking.bookingRef,
    });

    const hotelBooking = await Booking.create({
      userId: regularUser._id,
      tripId: trip._id,
      type: 'hotel',
      bookingRef: 'BK-HT-4482B2',
      status: 'confirmed',
      totalAmount: 36000,
      currency: 'INR',
      details: {
        name: 'Grand Hyatt Paris',
        nights: 4,
        roomType: 'Deluxe King Room',
      },
    });

    await Expense.create({
      tripId: trip._id,
      userId: regularUser._id,
      category: 'accommodation',
      description: 'Booking: Grand Hyatt Paris',
      amount: 36000,
      currency: 'INR',
      bookingRef: hotelBooking.bookingRef,
    });

    console.log('💳 Created Sample Bookings and Linked Expenses');

    // 7. Create Share Record
    await Share.create({
      tripId: trip._id,
      sharedBy: regularUser._id,
      sharedWith: companionUser._id,
      permission: 'edit',
    });

    console.log('🤝 Created Sample Trip Share');

    console.log('\n======================================================');
    console.log('🎉 SEED COMPLETED SUCCESSFULLY!');
    console.log('======================================================');
    console.log('Admin Credentials:');
    console.log('  Email:    admin@tripplanner.com');
    console.log('  Password: adminPassword123');
    console.log('  Role:     admin');
    console.log('------------------------------------------------------');
    console.log('Regular User Credentials:');
    console.log('  Email:    alex@example.com');
    console.log('  Password: userPassword123');
    console.log('  Role:     user');
    console.log('------------------------------------------------------');
    console.log('Collaborator Credentials:');
    console.log('  Email:    sarah@example.com');
    console.log('  Password: sarahPassword123');
    console.log('  Role:     user (shared on French Odyssey trip with edit access)');
    console.log('======================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seedData();
