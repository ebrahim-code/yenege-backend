const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Updated to use Gemini 3.1 Flash Lite Preview (as requested)
const MODEL_NAME = 'gemini-3.1-flash-lite-preview';

const SYSTEM_PROMPT = `You are an AI assistant for Yenege, an Ethiopian artisan digital marketplace that empowers local artisans and preserves cultural heritage.

Your role is to help users with:
1. Customer Support - Answer questions about products, orders, shipping, returns, and account issues
2. Product Recommendations - Suggest Ethiopian artisan products based on preferences, occasions, or interests
3. Cultural Information - Explain the significance of Ethiopian crafts, textiles, coffee ceremony, etc.
4. Seller Assistance - Help sellers with listing optimization, pricing, and marketplace guidance

Key information about Yenege:
- Yenege connects Ethiopian artisans directly to global customers
- Products include: Textiles & Shawls, Baskets & Home Decor, Coffee Ceremony items, Jewelry, Pottery, Traditional Clothing, Leather Goods, and Art
- All products are handmade by Ethiopian artisans
- The platform removes middlemen to ensure fair income for artisans
- Supports preserving ancient Ethiopian crafts and traditions

Always be helpful, friendly, and culturally respectful. If you don't know something specific about an order or account, direct users to contact support.`;

// @desc    Chat with AI assistant
// @route   POST /api/ai/chat
// @access  Public
exports.chat = async (req, res) => {
  try {
    const { message, history = [], language = 'en' } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const langInstruction = language === 'am'
      ? '\n\nIMPORTANT: The user has selected Amharic (አማርኛ) as their language. You MUST respond entirely in Amharic script. Do not use English in your response unless quoting a product name that has no Amharic equivalent.'
      : '\n\nRespond in English.';

    const model = genAI.getGenerativeModel({ 
      model: MODEL_NAME,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    });

    // Build conversation with system instruction
    const fullPrompt = `${SYSTEM_PROMPT}${langInstruction}\n\nUser: ${message}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    res.json({
      success: true,
      message: text,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('AI Chat Error:', error.message);
    console.error('Full error:', error);
    
    // Check if error is due to Rate Limiting (429) or Service Unavailable (503)
    const statusCode = error.response?.status || error.code;
    const isRateLimit = statusCode === 429 || error.message.includes('429') || error.message.includes('rate limit');
    const isOverloaded = statusCode === 503 || error.message.includes('503');
    
    res.status(isRateLimit ? 429 : isOverloaded ? 503 : 500).json({
      success: false,
      message: isRateLimit 
        ? 'Too many requests. Please wait a moment and try again.' 
        : isOverloaded 
          ? 'The AI service is temporarily unavailable. Please try again soon.'
          : 'Sorry, I encountered an error while processing your request. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};


// @desc    Get product recommendations
// @route   POST /api/ai/recommendations
// @access  Public
exports.getRecommendations = async (req, res) => {
  try {
    const { preferences, occasion, budget, language = 'en' } = req.body;

    const model = genAI.getGenerativeModel({ 
      model: MODEL_NAME,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    });

    const langNote = language === 'am'
      ? '\n\nIMPORTANT: Respond entirely in Amharic (አማርኛ) script.'
      : '';

    const prompt = `As a Yenege marketplace assistant, recommend Ethiopian artisan products based on:
- Preferences: ${preferences || 'Not specified'}
- Occasion: ${occasion || 'Not specified'}
- Budget: ${budget || 'Not specified'}

Available categories: Textiles & Shawls, Baskets & Home Decor, Coffee Ceremony items, Jewelry, Pottery & Ceramics, Traditional Clothing, Leather Goods, Paintings & Art.

Provide 3-5 specific product recommendations with brief explanations of why they match the request. Include cultural significance where relevant.${langNote}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({
      success: true,
      recommendations: text,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('AI Recommendations Error:', error.message);
    console.error('Full error:', error);

    const statusCode = error.response?.status || error.code;
    const isRateLimit = statusCode === 429 || error.message.includes('429') || error.message.includes('rate limit');
    const isOverloaded = statusCode === 503 || error.message.includes('503');

    res.status(isRateLimit ? 429 : isOverloaded ? 503 : 500).json({
      success: false,
      message: isRateLimit 
        ? 'Too many requests. Please wait a moment and try again.' 
        : isOverloaded 
          ? 'The AI service is temporarily unavailable. Please try again soon.'
          : 'Sorry, I could not generate recommendations at this time.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// @desc    Get seller assistance
// @route   POST /api/ai/seller-assist
// @access  Private
exports.sellerAssist = async (req, res) => {
  try {
    const { question, productInfo, language = 'en' } = req.body;

    const model = genAI.getGenerativeModel({ 
      model: MODEL_NAME,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    });

    const langNote = language === 'am'
      ? '\n\nIMPORTANT: Respond entirely in Amharic (አማርኛ) script.'
      : '';

    const prompt = `As a Yenege marketplace seller assistant, help with the following:

Question: ${question}
${productInfo ? `Product Information: ${JSON.stringify(productInfo)}` : ''}

Provide helpful, actionable advice for Ethiopian artisans selling on Yenege. Consider:
- Product listing optimization
- Pricing strategies for handmade goods
- Cultural storytelling in descriptions
- Photography tips
- Customer engagement

Be encouraging and supportive of traditional craftsmanship.${langNote}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({
      success: true,
      answer: text,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('AI Seller Assist Error:', error.message);
    console.error('Full error:', error);

    const statusCode = error.response?.status || error.code;
    const isRateLimit = statusCode === 429 || error.message.includes('429') || error.message.includes('rate limit');
    const isOverloaded = statusCode === 503 || error.message.includes('503');

    res.status(isRateLimit ? 429 : isOverloaded ? 503 : 500).json({
      success: false,
      message: isRateLimit 
        ? 'Too many requests. Please wait a moment and try again.' 
        : isOverloaded 
          ? 'The AI service is temporarily unavailable. Please try again soon.'
          : 'Sorry, I could not assist at this time.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
