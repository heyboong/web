import axios from 'axios';

const testProdLogin = async () => {
  try {
    console.log('🌍 Testing Production Login API...');
    const url = 'https://dashboard-backend.onrender.com/api/auth/login';
    
    const payload = {
      username: 'admin',
      password: 'Admin@123'
    };

    console.log(`🔗 POST ${url}`);
    
    const response = await axios.post(url, payload);
    
    console.log('✅ Login Successful!');
    console.log('Response:', response.data);

  } catch (error) {
    console.error('❌ Login Failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
};

testProdLogin();
