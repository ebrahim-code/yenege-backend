const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Updated to use Gemini 3.1 Flash Lite Preview (as requested)
const MODEL_NAME = 'gemini-3.1-flash-lite-preview';

const SYSTEM_PROMPT = `You are a concise AI assistant for Yenege, a modern Ethiopian e-commerce marketplace.

Your role is to help users with:
1. Customer Support - Account creation, orders, shipping, returns, payments, and technical issues
2. Product Information - All product categories (electronics, fashion, home goods, beauty, sports, books, toys, etc.)
3. Marketplace Guidance - Buying, selling, promotions, and platform features
4. General Assistance - Any questions about using Yenege platform

Key information about Yenege:
- Yenege is Ethiopia's premier online marketplace for ALL product categories
- We connect buyers and sellers across Ethiopia and globally
- Products include: Electronics, Fashion, Home & Garden, Beauty, Sports, Books, Toys, Automotive, Industrial Equipment, and MORE
- We serve individual consumers, businesses, and sellers
- Fast shipping, secure payments, buyer protection

COMMUNICATION STYLE:
- Be CONCISE and DIRECT - get straight to the point
- Keep responses under 150 words unless detailed explanation is specifically requested
- Use bullet points when listing multiple items
- Focus on the CORE answer first, then add brief context if needed
- Avoid lengthy introductions or unnecessary explanations
- If user asks a simple question, give a simple answer

Always be helpful, friendly, and professional. For account-specific or order-specific issues, direct users to check their dashboard or contact support.`;

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
      ? '\n\nIMPORTANT: Respond in Amharic (አማርኛ). Be CONCISE and DIRECT - keep responses under 150 words.'
      : '\n\nRespond in English. Be CONCISE and DIRECT - keep responses under 150 words.';

    const model = genAI.getGenerativeModel({ 
      model: MODEL_NAME,
      generationConfig: {
        temperature: 0.6,        // More focused, less creative
        topK: 30,               // Narrower selection for consistency
        topP: 0.9,              // Higher probability tokens
        maxOutputTokens: 512,   // Limit to shorter responses
      }
    });

    // Build conversation with system instruction - emphasize brevity
    const fullPrompt = `${SYSTEM_PROMPT}${langInstruction}\n\nUser Question: ${message}\n\nConcise Answer:`;

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
        temperature: 0.6,
        topK: 30,
        topP: 0.9,
        maxOutputTokens: 512,
      }
    });

    const langNote = language === 'am'
      ? '\n\nRespond in Amharic (አማርኛ). Be CONCISE - under 150 words.'
      : '';

    const prompt = `As a Yenege marketplace assistant, recommend products based on:
- Preferences: ${preferences || 'Not specified'}
- Occasion: ${occasion || 'Not specified'}
- Budget: ${budget || 'Not specified'}

Available categories: Electronics, Fashion, Home & Garden, Beauty, Sports, Books, Toys, Automotive, Industrial, Health, Grocery, and MORE.

Provide 3-5 specific product recommendations with brief explanations. Be CONCISE and DIRECT.${langNote}`;

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
        temperature: 0.6,
        topK: 30,
        topP: 0.9,
        maxOutputTokens: 512,
      }
    });

    const langNote = language === 'am'
      ? '\n\nRespond in Amharic (አማርኛ). Be CONCISE - under 150 words.'
      : '';

    const prompt = `As a Yenege marketplace seller assistant, help with:

Question: ${question}
${productInfo ? `Product Info: ${JSON.stringify(productInfo)}` : ''}

Provide CONCISE, actionable advice for Ethiopian artisans. Focus on:
- Product listing optimization
- Pricing strategies
- Cultural storytelling
- Photography tips
- Customer engagement

Be direct and supportive.${langNote}`;

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
