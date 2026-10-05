/**
 * Weather service utility
 * Provides current weather conditions and 5-day forecast for any destination.
 */

const CONDITIONS = [
  { condition: 'Sunny', icon: '☀️', minTemp: 22, maxTemp: 32, humidity: 45 },
  { condition: 'Partly Cloudy', icon: '⛅', minTemp: 20, maxTemp: 28, humidity: 55 },
  { condition: 'Clear', icon: '🌤️', minTemp: 18, maxTemp: 26, humidity: 50 },
  { condition: 'Rainy', icon: '🌧️', minTemp: 16, maxTemp: 22, humidity: 85 },
  { condition: 'Breezy', icon: '💨', minTemp: 19, maxTemp: 25, humidity: 60 },
];

/**
 * Deterministic hash from destination string to produce stable mock weather
 */
const getHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const getWeatherData = async (destinationName = 'Paris') => {
  const hash = getHash(destinationName.toLowerCase().trim());
  const selectedCondition = CONDITIONS[hash % CONDITIONS.length];

  const currentTemp =
    selectedCondition.minTemp +
    (hash % (selectedCondition.maxTemp - selectedCondition.minTemp + 1));

  const forecast = Array.from({ length: 5 }, (_, i) => {
    const dayDate = new Date(Date.now() + i * 86400000).toISOString().split('T')[0];
    const cond = CONDITIONS[(hash + i) % CONDITIONS.length];
    return {
      date: dayDate,
      condition: cond.condition,
      icon: cond.icon,
      temperature: {
        min: cond.minTemp,
        max: cond.maxTemp,
      },
      humidity: cond.humidity,
    };
  });

  return {
    destination: destinationName,
    current: {
      temperature: currentTemp,
      unit: '°C',
      condition: selectedCondition.condition,
      icon: selectedCondition.icon,
      humidity: `${selectedCondition.humidity}%`,
      windSpeed: `${10 + (hash % 15)} km/h`,
      feelsLike: currentTemp + 1,
    },
    forecast,
    retrievedAt: new Date().toISOString(),
  };
};

module.exports = {
  getWeatherData,
};
