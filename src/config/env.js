const dotenv = require('dotenv');
dotenv.config();

const required = ['MONGO_URI', 'JWT_SECRET'];

for (const key of required) {
  if (!process.env[key]) {
    console.error(`❌ Missing required env var: ${key}`);
    process.exit(1);
  }
}

// Optional vars — warn if missing
const optional = ['FIREBASE_SERVICE_ACCOUNT'];
for (const key of optional) {
  if (!process.env[key]) {
    console.warn(`⚠️  Optional env var ${key} is not set. Related features will be disabled.`);
  }
}

module.exports = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  NODE_ENV: process.env.NODE_ENV || 'development',
};
