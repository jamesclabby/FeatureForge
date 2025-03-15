const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from the root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

console.log('Environment variables test:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? 'Password is set' : 'Password is NOT set');
console.log('NODE_ENV:', process.env.NODE_ENV); 