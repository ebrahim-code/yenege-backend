const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MODEL_NAME = 'gemini-3.1-flash-lite-preview';

const SYSTEM_PROMPT = `You are an AI assistant for Yenege, an Ethiopian artisan marketplace that empowers women and preserves cultural heritage.

Your role is to help users with:
1. Customer Support - Answer questions about products, orders, shipping, returns, and account issues
2. Product Recommendations - Suggest Ethiopian artisan products based on preferences, occasions, or interests
3. Cultural Information - Explain the significance of Ethiopian crafts, textiles, coffee ceremony, etc.
4. Seller Assistance - Help sellers with listing optimization, pricing, and marketplace guidance

Key information about Yenege:
- Yenege connects Ethiopian women artisans directly to global customers
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
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Use Gemini 3.1 Flash-Lite model
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    // Start chat with history
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: SYSTEM_PROMPT }],
        },
        {
          role: 'model',
          parts: [{ text: 'I understand. I am ready to assist users with Yenege marketplace as a helpful AI assistant.' }],
        },
        ...history.map(msg => ({
          role: msg.role,
          parts: [{ text: msg.content }],
        })),
      ],
    });

    // Send message and get response
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    res.json({
      success: true,
      message: text,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({
      success: false,
      message: 'Sorry, I encountered an error. Please try again later.',
      error: error.message,
    });
  }
};

// @desc    Get product recommendations
// @route   POST /api/ai/recommendations
// @access  Public
exports.getRecommendations = async (req, res) => {
  try {
   const { preferences, occasion, budget } = req.body;

    // Use Gemini 3.1 Flash-Lite model
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const prompt = `As a Yenege marketplace assistant, recommend Ethiopian artisan products based on:
- Preferences: ${preferences || 'Not specified'}
- Occasion: ${occasion || 'Not specified'}
- Budget: ${budget || 'Not specified'}

Available categories: Textiles & Shawls, Baskets & Home Decor, Coffee Ceremony items, Jewelry, Pottery & Ceramics, Traditional Clothing, Leather Goods, Paintings & Art.

Provide 3-5 specific product recommendations with brief explanations of why they match the request. Include cultural significance where relevant.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({
      success: true,
      recommendations: text,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('AI Recommendations Error:', error);
    res.status(500).json({
      success: false,
      message: 'Sorry, I could not generate recommendations at this time.',
      error: error.message,
    });
  }
};

// @desc    Get seller assistance
// @route   POST /api/ai/seller-assist
// @access  Private
exports.sellerAssist = async (req, res) => {
  try {
  const { question, productInfo } = req.body;

    // Use Gemini 3.1 Flash-Lite model
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const prompt = `As a Yenege marketplace seller assistant, help with the following:

Question: ${question}
${productInfo ? `Product Information: ${JSON.stringify(productInfo)}` : ''}

Provide helpful, actionable advice for Ethiopian artisans selling on Yenege. Consider:
- Product listing optimization
- Pricing strategies for handmade goods
- Cultural storytelling in descriptions
- Photography tips
- Customer engagement

Be encouraging and supportive of traditional craftsmanship.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({
      success: true,
      answer: text,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('AI Seller Assist Error:', error);
    res.status(500).json({
      success: false,
      message: 'Sorry, I could not assist at this time.',
      error: error.message,
    });
  }
};
