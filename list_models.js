require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

console.log('🔍 Listing Available Gemini Models...\n');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  try {
    console.log('Fetching available models...\n');
    
    // Use the base URL to list models
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('✅ Available Models:\n');
    console.log('=' .repeat(80));
    
    if (data.models && data.models.length > 0) {
      data.models.forEach(model => {
        const modelName = model.name.replace('models/', '');
        const displayName = model.displayName || 'N/A';
        const description = model.description ? model.description.substring(0, 100) + '...' : 'No description';
        const supportedMethods = model.supportedGenerationMethods?.join(', ') || 'N/A';
        
        console.log(`\n📦 Model: ${modelName}`);
        console.log(`   Display Name: ${displayName}`);
        console.log(`   Description: ${description}`);
        console.log(`   Supported Methods: ${supportedMethods}`);
        console.log('=' .repeat(80));
      });
    } else {
      console.log('No models found or unable to access model list.');
    }
    
    console.log('\n💡 Recommended models for chat:');
    console.log('   - gemini-pro (if available)');
    console.log('   - gemini-1.5-flash (if available)');
    console.log('   - gemini-1.5-pro (if available)\n');
    
  } catch (error) {
    console.error('\n❌ Error listing models:', error.message);
    console.error('\nThis might indicate:');
    console.error('1. API key is invalid or expired');
    console.error('2. Network connectivity issues');
    console.error('3. API endpoint has changed\n');
  }
}

listModels();
