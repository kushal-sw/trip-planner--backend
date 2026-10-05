/**
 * Mock data utility for realistic flight and hotel search results
 * No database models are stored for search results.
 */

const AIRLINES = [
  { code: 'AI', name: 'Air India' },
  { code: '6E', name: 'IndiGo' },
  { code: 'UK', name: 'Vistara' },
  { code: 'SG', name: 'SpiceJet' },
  { code: 'EK', name: 'Emirates' },
  { code: 'BA', name: 'British Airways' },
  { code: 'AF', name: 'Air France' },
];

const HOTEL_CHAINS = [
  { name: 'Grand Hyatt', rating: 4.8, priceBase: 12000, amenities: ['Pool', 'Spa', 'Free WiFi', 'Breakfast Included', 'Gym'] },
  { name: 'Marriott Resort & Suites', rating: 4.6, priceBase: 9500, amenities: ['Pool', 'Bar', 'Free WiFi', 'Airport Shuttle'] },
  { name: 'Radisson Blu', rating: 4.4, priceBase: 6500, amenities: ['Free WiFi', 'Fitness Center', 'Restaurant'] },
  { name: 'Holiday Inn Express', rating: 4.1, priceBase: 4200, amenities: ['Free WiFi', 'Breakfast', 'Parking'] },
  { name: 'Taj Palace & Heritage', rating: 4.9, priceBase: 18000, amenities: ['Luxury Spa', 'Butler Service', 'Fine Dining', 'Pool'] },
  { name: 'Ibis City Center', rating: 4.0, priceBase: 3500, amenities: ['Free WiFi', '24h Reception', 'Work desk'] },
  { name: 'Hilton Garden Inn', rating: 4.5, priceBase: 8000, amenities: ['Pool', 'Restaurant', 'Free WiFi', 'Room Service'] },
];

/**
 * Generate 5-10 realistic mock flights based on from, to, and date
 */
const generateFlights = (from = 'DEL', to = 'BOM', date = new Date().toISOString().split('T')[0]) => {
  const count = 6;
  const classes = ['Economy', 'Premium Economy', 'Business'];

  return Array.from({ length: count }, (_, idx) => {
    const airline = AIRLINES[idx % AIRLINES.length];
    const flightNumber = `${airline.code}-${Math.floor(100 + Math.random() * 900)}`;
    const departureHour = 6 + idx * 2;
    const departure = `${date}T${departureHour.toString().padStart(2, '0')}:30:00.000Z`;
    const arrivalHour = departureHour + 2;
    const arrival = `${date}T${arrivalHour.toString().padStart(2, '0')}:45:00.000Z`;
    const flightClass = classes[idx % classes.length];
    const basePrice = 3500 + idx * 1200;
    const price = flightClass === 'Business' ? basePrice * 2.5 : basePrice;

    return {
      flightNumber,
      airline: airline.name,
      airlineCode: airline.code,
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      date,
      departureTime: departure,
      arrivalTime: arrival,
      duration: '2h 15m',
      stops: 0,
      cabinClass: flightClass,
      seatsAvailable: Math.floor(5 + Math.random() * 40),
      price: Math.round(price),
      currency: 'INR',
    };
  });
};

/**
 * Generate 5-10 realistic mock hotels based on destination, checkIn, and checkOut
 */
const generateHotels = (
  destination = 'Paris',
  checkIn = new Date().toISOString().split('T')[0],
  checkOut = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
) => {
  const d1 = new Date(checkIn);
  const d2 = new Date(checkOut);
  const nights = Math.max(1, Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)));

  return HOTEL_CHAINS.map((hotel, index) => {
    const pricePerNight = hotel.priceBase + (index % 3) * 500;
    const totalPrice = pricePerNight * nights;

    return {
      hotelId: `HOTEL-${index + 101}`,
      name: `${hotel.name} ${destination}`,
      destination,
      rating: hotel.rating,
      pricePerNight,
      nights,
      totalPrice,
      currency: 'INR',
      roomType: index % 2 === 0 ? 'Deluxe King Room' : 'Standard Double Room',
      amenities: hotel.amenities,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      address: `${10 + index * 4} Promenade Avenue, ${destination}`,
    };
  });
};

module.exports = {
  generateFlights,
  generateHotels,
};
