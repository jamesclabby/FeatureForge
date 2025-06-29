const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
console.log('Loading .env file from:', path.resolve(__dirname, '.env'));
const result = dotenv.config({ path: path.resolve(__dirname, '.env') });

if (result.error) {
  console.error('Error loading .env file:', result.error);
} else {
  console.log('✅ .env file loaded successfully');
}

console.log('\n📧 Email Configuration:');
console.log('EMAIL_PROVIDER:', process.env.EMAIL_PROVIDER);
console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? `${process.env.RESEND_API_KEY.substring(0, 10)}...` : 'NOT FOUND');
console.log('EMAIL_FROM_ADDRESS:', process.env.EMAIL_FROM_ADDRESS);
console.log('EMAIL_FROM_NAME:', process.env.EMAIL_FROM_NAME);
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);

console.log('\n🔍 All environment variables containing "EMAIL" or "RESEND":');
Object.keys(process.env)
  .filter(key => key.includes('EMAIL') || key.includes('RESEND'))
  .forEach(key => {
    const value = key.includes('KEY') ? 
      (process.env[key] ? `${process.env[key].substring(0, 10)}...` : 'NOT FOUND') : 
      process.env[key];
    console.log(`${key}:`, value);
  }); 