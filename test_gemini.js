require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

console.log('Testing Gemini API Key...\n');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testAPI() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    console.log('Sending test message...');
    const result = await model.generateContent('Say hello in one word');
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ API Key is working!');
    console.log('Response:', text);
  } catch (error) {
    console.error('❌ API Key Error:', error.message);
    console.error('\nMake sure GEMINI_API_KEY is set correctly in your .env file');
  }
}

testAPI();
