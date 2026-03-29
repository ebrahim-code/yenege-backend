require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

console.log('🔍 Testing Gemini API...\n');
console.log('Model: gemini-3.1-flash-lite-preview (Requested Model)');
console.log('API Key exists:', !!process.env.GEMINI_API_KEY);
console.log('');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testAPI() {
  try {
    console.log('📤 Sending test message...');
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-3.1-flash-lite-preview',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    });
    
    const result = await model.generateContent('Say hello in one word and tell me what marketplace you assist');
    const response = await result.response;
    const text = response.text();
    
    console.log('\n✅ SUCCESS! API Key is working!');
    console.log('\n💬 Response:', text);
    console.log('\n✨ Model is ready to use in production!\n');
  } catch (error) {
    console.error('\n❌ API Key Error:', error.message);
    console.error('\nStatus:', error.response?.status || error.code);
    console.error('\nTroubleshooting tips:');
    console.error('1. Make sure GEMINI_API_KEY is set correctly in your .env file');
    console.error('2. Check if the API key has not expired');
    console.error('3. Verify you have internet connectivity');
    console.error('4. Check if there are any rate limits on your API key\n');
  }
}

testAPI();
