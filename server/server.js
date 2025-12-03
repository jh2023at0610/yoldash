const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Initialize Firebase and database
let User, TokenTransaction, db, generateToken, authenticate, checkTokenBalance, deductToken, adminAuth;
try {
  const dbModule = require('./db');
  User = dbModule.User;
  TokenTransaction = dbModule.TokenTransaction;
  const firebaseModule = require('./firebase');
  db = firebaseModule.db;
  const authModule = require('./auth');
  generateToken = authModule.generateToken;
  authenticate = authModule.authenticate;
  const tokenCheckModule = require('./middleware/tokenCheck');
  checkTokenBalance = tokenCheckModule.checkTokenBalance;
  deductToken = tokenCheckModule.deductToken;
  const adminAuthModule = require('./middleware/adminAuth');
  adminAuth = adminAuthModule.adminAuth;
  console.log('✓ Database and auth modules loaded');
} catch (error) {
  console.error('✗ Failed to load database/auth modules:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 3001;

// Request logging middleware (FIRST - to catch all requests including OPTIONS)
app.use((req, res, next) => {
  console.log(`\n[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Origin:', req.headers.origin);
  console.log('Content-Type:', req.headers['content-type']);
  next();
});

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Body logging middleware (after body parsing)
app.use((req, res, next) => {
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Test route
app.post('/api/test', (req, res) => {
    res.json({ message: 'POST route works', body: req.body });
});

// Auth Routes
try {
  console.log('Registering /api/auth/register route...');
  app.post('/api/auth/register', async (req, res) => {
      console.log('=== REGISTER ENDPOINT HIT ===');
      console.log('Request body:', req.body);
      console.log('Request headers:', req.headers);
    try {
        const { email, phone, password, name, lastname } = req.body;

        if (!email || !phone || !password || !name || !lastname) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Create user (User.create checks for duplicates internally)
        const result = await User.create(email, phone, password, name, lastname);
        const user = await User.findById(result.id);

        const token = generateToken(user.id);

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                phone: user.phone,
                name: user.name,
                lastname: user.lastname,
                tokenBalance: user.tokenBalance || 20,
                isAdmin: user.isAdmin || false
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        console.error('Error stack:', error.stack);
        if (error.message === 'Email already registered' || error.message === 'Phone number already registered') {
            return res.status(400).json({ error: error.message });
        }
        if (!res.headersSent) {
            res.status(500).json({ error: 'Registration failed', details: error.message });
        }
    }
  });
  console.log('✓ /api/auth/register route registered');
} catch (error) {
  console.error('✗ Failed to register /api/auth/register route:', error);
  process.exit(1);
}

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        if (!User.verifyPassword(password, user.password)) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = generateToken(user.id);

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                phone: user.phone,
                name: user.name,
                lastname: user.lastname,
                tokenBalance: user.tokenBalance || 0,
                isAdmin: user.isAdmin || false
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed', details: error.message });
    }
});

app.get('/api/auth/me', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            user: {
                id: user.id,
                email: user.email,
                phone: user.phone,
                name: user.name,
                lastname: user.lastname,
                tokenBalance: user.tokenBalance || 0,
                isAdmin: user.isAdmin || false,
                created_at: user.created_at
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user', details: error.message });
    }
});

// User balance endpoint
app.get('/api/user/balance', authenticate, async (req, res) => {
    try {
        const balance = await User.getTokenBalance(req.userId);
        res.json({ balance });
    } catch (error) {
        console.error('Get balance error:', error);
        res.status(500).json({ error: 'Failed to get balance', details: error.message });
    }
});

// Admin routes
app.get('/api/admin/users', authenticate, adminAuth, async (req, res) => {
    try {
        const users = await User.getAllUsers();
        res.json({ users });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to get users', details: error.message });
    }
});

app.post('/api/admin/add-tokens', authenticate, adminAuth, async (req, res) => {
    try {
        const { userId, amount } = req.body;

        if (!userId || !amount || amount <= 0) {
            return res.status(400).json({ error: 'User ID and positive amount are required' });
        }

        const newBalance = await User.updateTokenBalance(userId, amount, 'add', req.userId);
        res.json({ 
            success: true, 
            message: 'Tokens added successfully',
            newBalance 
        });
    } catch (error) {
        console.error('Add tokens error:', error);
        res.status(500).json({ error: 'Failed to add tokens', details: error.message });
    }
});

app.get('/api/admin/transactions/:userId', authenticate, adminAuth, async (req, res) => {
    try {
        const { userId } = req.params;
        const transactions = await TokenTransaction.getByUserId(userId);
        res.json({ transactions });
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ error: 'Failed to get transactions', details: error.message });
    }
});

app.delete('/api/admin/users/:userId', authenticate, adminAuth, async (req, res) => {
    try {
        const { userId } = req.params;

        // Prevent admin from deleting themselves
        if (userId === req.userId) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Delete user's transactions
        const transactions = await TokenTransaction.getByUserId(userId);
        const batch = db.batch();
        transactions.forEach(transaction => {
            const transactionRef = db.collection('tokenTransactions').doc(transaction.id);
            batch.delete(transactionRef);
        });
        await batch.commit();

        // Delete user
        await db.collection('users').doc(userId).delete();

        res.json({ 
            success: true, 
            message: 'User deleted successfully' 
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user', details: error.message });
    }
});

// File Upload Setup
const upload = multer({ 
    dest: 'uploads/',
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// Gemini Setup with File Search Tool
console.log('Initializing Gemini with API key:', process.env.GEMINI_API_KEY ? 'Key present (length: ' + process.env.GEMINI_API_KEY.length + ')' : 'NO KEY FOUND');

if (!process.env.GEMINI_API_KEY) {
    console.error('ERROR: GEMINI_API_KEY not found in environment variables');
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Model configuration - File Search Tool supported models
const modelName = "gemini-2.5-flash"; // Supported model for File Search Tool

// File Search Store - persistent store
let fileSearchStoreName = null;
const STORE_NAME_ENV = process.env.FILE_SEARCH_STORE_NAME;

// Initialize File Search Store (reuse existing or create new)
async function initializeFileSearchStore() {
    try {
        // If store name exists in .env, try to use existing store
        if (STORE_NAME_ENV) {
            fileSearchStoreName = STORE_NAME_ENV;
            console.log(`Checking existing File Search Store: ${fileSearchStoreName}`);
            
            try {
                // Verify store exists
                await ai.fileSearchStores.get({ name: fileSearchStoreName });
                console.log(`✓ Using existing File Search Store: ${fileSearchStoreName}`);
                return;
            } catch (error) {
                console.log(`Store not found, will create new one...`);
            }
        }
        
        // Create new store if none exists
        console.log('Creating new File Search Store...');
        const fileSearchStore = await ai.fileSearchStores.create({
            config: { displayName: 'Yoldaş Knowledge Base' }
        });
        fileSearchStoreName = fileSearchStore.name;
        console.log(`✓ File Search Store created: ${fileSearchStoreName}`);
        console.log(`\n⚠️ IMPORTANT: Add this to your .env file to reuse this store:`);
        console.log(`FILE_SEARCH_STORE_NAME=${fileSearchStoreName}\n`);
    } catch (error) {
        console.error('✗ Failed to initialize File Search Store:', error.message);
        throw error;
    }
}

// Initialize on startup
initializeFileSearchStore().catch(err => {
    console.error('Failed to initialize File Search Store:', err);
    process.exit(1);
});

// Admin/Internal Routes (for one-time file indexing)
app.post('/api/admin/upload', upload.array('files', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        if (!fileSearchStoreName) {
            return res.status(500).json({ error: 'File Search Store not initialized' });
        }

        console.log(`Uploading ${req.files.length} file(s) to File Search Store...`);
        const uploadedFiles = [];

        for (const file of req.files) {
            const filePath = file.path;
            const originalName = file.originalname;
            const mimeType = file.mimetype || 'application/pdf'; // Default to PDF if not detected

            console.log(`Uploading ${originalName} (${mimeType}) to File Search Store...`);

            try {
                // Upload and import file into File Search Store
                let operation = await ai.fileSearchStores.uploadToFileSearchStore({
                    file: filePath,
                    fileSearchStoreName: fileSearchStoreName,
                    config: {
                        displayName: originalName,
                        mimeType: mimeType,
                    }
                });

                console.log(`✓ Upload initiated for ${originalName}, waiting for indexing...`);

                // Wait until import/indexing is complete
                while (!operation.done) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    operation = await ai.operations.get({ operation });
                    console.log(`Waiting for ${originalName} to be indexed...`);
                }

                if (operation.error) {
                    throw new Error(`File indexing failed: ${operation.error.message || 'Unknown error'}`);
                }

                console.log(`✓ File indexed successfully: ${originalName}`);

                uploadedFiles.push({
                    name: originalName,
                    displayName: originalName
                });

                // Clean up local file
                fs.unlinkSync(filePath);
            } catch (uploadError) {
                console.error(`✗ Failed to upload ${originalName}:`, uploadError.message);
                // Clean up local file even on error
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
                throw uploadError;
            }
        }

        res.json({
            success: true,
            files: uploadedFiles.map(f => ({ name: f.displayName })),
            totalFiles: uploadedFiles.length,
            message: 'Files uploaded and indexed successfully'
        });
    } catch (error) {
        console.error('Upload error details:', {
            message: error.message,
            status: error.status,
            statusText: error.statusText,
            details: error.details || error
        });
        res.status(500).json({
            error: 'Failed to upload file to File Search Store',
            details: error.message
        });
    }
});

// Chat endpoint (text only, no images) - protected
app.post('/api/chat', authenticate, checkTokenBalance, async (req, res) => {
    console.log('\n=== CHAT REQUEST RECEIVED ===');
    console.log('Request body:', JSON.stringify({ 
        message: req.body.message?.substring(0, 50) + '...',
        hasHistory: !!req.body.history,
        historyLength: req.body.history?.length || 0
    }));
    
    try {
        const { message, history } = req.body;

        if (!message || !message.trim()) {
            console.log('✗ Error: Message is required');
            return res.status(400).json({ error: 'Message is required' });
        }

        if (!fileSearchStoreName) {
            console.log('✗ Error: File Search Store not initialized');
            return res.status(500).json({ error: 'File Search Store not initialized' });
        }
        
        console.log('✓ Request validated, proceeding...');

        // Build the prompt
        let contextPrompt = "Sən 'Yoldaş' adlı süni intellekt köməkçisisən. Yalnız sənə təqdim olunan sənədlərə əsaslanaraq sualları cavablandır. Cavabların Azərbaycan dilində olmalıdır.\n\n";
        contextPrompt += "Vacibdir: Cavab verərkən, əgər sənəddə müəyyən maddə, bənd və ya bölməyə istinad edirsənsə (məsələn, 2.1.1 maddəsi, 5-ci bənd və s.), cavabında bu məlumatı dəqiq göstər. Məlumatı qısa olaraq mötərizədə rəqəmlərlər göstərməyin kifayətdir. Məsələn, əgər mətndə İnzibati Xətalar Məcəlləsinin 93-cü maddəsinin 3.1 bəndinə istinad edirsə, izahın sonunda mötərizədə belə göstər - İXM 93.3.1. Və yaxud da \"Yol Hərəkəti Haqqında\" qanunun 25ci maddəsinin 2ci bəndində istinad edilirse sonda belə göstər - \"Yol Hərəkəti Haqqında\" 25.2. İstinadın harada yerləşməsi barədə əlavə şərhə ehtiyac yoxdur.\n\n";

        if (history && history.length > 0) {
            contextPrompt += "Əvvəlki söhbət:\n";
            history.forEach(msg => {
                contextPrompt += `${msg.role === 'user' ? 'İstifadəçi' : 'Siz'}: ${msg.content}\n`;
            });
            contextPrompt += "\n";
        }

        contextPrompt += `İstifadəçinin yeni sualı: ${message}`;

        console.log("Sending request to Gemini with File Search Tool...");
        console.log("Message:", message.substring(0, 100) + "...");

        // Generate content using File Search Tool (text only)
        let response;
        try {
            response = await ai.models.generateContent({
                model: modelName,
                contents: contextPrompt, // SDK accepts string directly
                config: {
                    tools: [
                        {
                            fileSearch: {
                                fileSearchStoreNames: [fileSearchStoreName]
                            }
                        }
                    ]
                }
            });
            console.log("✓ API call completed");
        } catch (apiError) {
            console.error("✗ API call failed:", apiError.message);
            console.error("Error details:", apiError);
            return res.status(500).json({ 
                error: 'Failed to call Gemini API',
                details: apiError.message 
            });
        }

        // Extract text from response - handle different response structures
        let text = '';
        
        console.log("Extracting text from response...");
        console.log("Response type:", typeof response);
        console.log("Response constructor:", response?.constructor?.name);
        console.log("Response has 'text' property:", 'text' in response);
        console.log("Response has 'candidates' property:", 'candidates' in response);
        console.log("Candidates count:", response?.candidates?.length || 0);
        
        // Log raw response structure (first 1000 chars to avoid huge logs)
        try {
            const responseStr = JSON.stringify(response, null, 2);
            console.log("Raw response (first 1000 chars):", responseStr.substring(0, 1000));
        } catch (e) {
            console.log("Could not stringify response:", e.message);
        }
        
        // Access the text getter (it's a getter, so we access it as a property)
        try {
            text = response.text; // This accesses the getter
            console.log("Got text from response.text getter, length:", text ? text.length : 0, "type:", typeof text);
            if (text) {
                console.log("Text preview:", text.substring(0, 100));
            }
        } catch (e) {
            console.log('✗ response.text getter access failed:', e.message);
            console.log('Error stack:', e.stack);
        }
        
        // Fallback: manually extract text from candidates if getter returned undefined
        if (!text && response && response.candidates && response.candidates.length > 0) {
            console.log("Trying to manually extract from candidates...");
            const candidate = response.candidates[0];
            console.log("First candidate structure:", {
                hasContent: !!candidate.content,
                hasParts: !!candidate.content?.parts,
                partsLength: candidate.content?.parts?.length || 0,
                finishReason: candidate.finishReason,
                finishMessage: candidate.finishMessage
            });
            
            if (candidate.content && candidate.content.parts) {
                // Log all parts to see what we have
                console.log("Parts details:", candidate.content.parts.map((part, idx) => ({
                    index: idx,
                    hasText: !!part.text,
                    textLength: part.text?.length || 0,
                    textPreview: part.text?.substring(0, 50) || 'N/A',
                    keys: Object.keys(part)
                })));
                
                text = candidate.content.parts
                    .filter(part => part && typeof part.text === 'string')
                    .map(part => part.text)
                    .join('');
                console.log("Manually extracted text from parts, length:", text ? text.length : 0);
            }
            
            // Check if there's a finish reason that might explain why there's no text
            if (candidate.finishReason && candidate.finishReason !== 'STOP') {
                console.log("⚠️ Warning: finishReason is:", candidate.finishReason);
                console.log("Finish message:", candidate.finishMessage);
            }
        }
        
        // Check for RECITATION finish reason
        if (response?.candidates?.[0]?.finishReason === 'RECITATION') {
            console.log('⚠️ RECITATION detected - retrying with modified prompt');
            
            // Retry with instruction to paraphrase
            const retryPrompt = contextPrompt + "\n\nVACİB: Cavabı öz sözlərinlə, sadə dillə izah et. Sənəddəki mətnləri olduğu kimi köçürmə, məzmunu öz cümlələrinlə ifadə et.";
            
            try {
                const retryResponse = await ai.models.generateContent({
                    model: modelName,
                    contents: retryPrompt,
                    config: {
                        tools: [{
                            fileSearch: {
                                fileSearchStoreNames: [fileSearchStoreName]
                            }
                        }]
                    }
                });
                
                text = retryResponse.text || '';
                if (text && text.trim()) {
                    console.log('✓ Retry successful with paraphrasing instruction');
                    response = retryResponse; // Use retry response for metadata
                } else {
                    throw new Error('Retry also returned no text');
                }
            } catch (retryError) {
                console.error('✗ Retry failed:', retryError.message);
                return res.status(500).json({ 
                    error: 'Cavab yaradıla bilmədi. Xahiş edirik sualınızı başqa sözlərlə ifadə edin.',
                    details: 'Model response was blocked. Please rephrase your question.'
                });
            }
        }
        
        // If still no text, log the response structure and return error
        if (!text || text.trim() === '') {
            console.error('✗ No text content in response');
            console.error('Full response structure:', JSON.stringify({
                hasText: response?.text !== undefined,
                textValue: response?.text,
                hasCandidates: !!response?.candidates,
                candidatesLength: response?.candidates?.length || 0,
                firstCandidate: response?.candidates?.[0] ? {
                    hasContent: !!response.candidates[0].content,
                    hasParts: !!response.candidates[0].content?.parts,
                    partsCount: response.candidates[0].content?.parts?.length || 0,
                    finishReason: response.candidates[0].finishReason
                } : null,
                responseKeys: response ? Object.keys(response) : []
            }, null, 2));
            return res.status(500).json({ 
                error: 'Cavab alına bilmədi. Xahiş edirik sualınızı başqa cür ifadə edin.',
                details: 'No response text received from model. Please rephrase your question.'
            });
        }
        
        console.log(`✓ Gemini response received (using File Search Tool with ${modelName}), text length: ${text.length}`);

        // Extract and format citations from grounding metadata
        let citationsText = '';
        if (response.groundingMetadata) {
            console.log('✓ Response includes citations from File Search Tool');
            
            // Log the structure for debugging (first time)
            if (!global._citationStructureLogged) {
                console.log('Grounding metadata structure:', JSON.stringify(response.groundingMetadata, null, 2));
                global._citationStructureLogged = true;
            }
            
            const metadata = response.groundingMetadata;
            
            // Extract citations from groundingChunks
            if (metadata.groundingChunks && metadata.groundingChunks.length > 0) {
                citationsText = '\n\n📚 **Mənbələr:**\n';
                
                // Use a Set to track unique sources
                const uniqueSources = new Set();
                
                metadata.groundingChunks.forEach((chunk, index) => {
                    let sourceInfo = '';
                    
                    // Check different possible structures
                    if (chunk.fileSearch) {
                        const fileName = chunk.fileSearch.fileName || 
                                       chunk.fileSearch.displayName || 
                                       chunk.fileSearch.uri?.split('/').pop() || 
                                       'Sənəd';
                        sourceInfo = fileName;
                        
                        // Add segment/chunk info if available
                        if (chunk.fileSearch.segment) {
                            sourceInfo += ` (${chunk.fileSearch.segment})`;
                        }
                    } else if (chunk.web) {
                        // Web source (if any)
                        sourceInfo = chunk.web.uri || chunk.web.title || 'Veb mənbə';
                    } else if (chunk.title || chunk.uri) {
                        // Generic source
                        sourceInfo = chunk.title || chunk.uri || 'Mənbə';
                    }
                    
                    if (sourceInfo && !uniqueSources.has(sourceInfo)) {
                        uniqueSources.add(sourceInfo);
                        citationsText += `${uniqueSources.size}. ${sourceInfo}\n`;
                    }
                });
                
                // If no fileSearch chunks found, try groundingSupports
                if (uniqueSources.size === 0 && metadata.groundingSupports) {
                    metadata.groundingSupports.forEach((support, index) => {
                        if (support.segment) {
                            const segmentText = support.segment.text || 
                                             support.segment || 
                                             `Bölmə ${index + 1}`;
                            citationsText += `${index + 1}. ${segmentText}\n`;
                        }
                    });
                }
            } else if (metadata.groundingSupports && metadata.groundingSupports.length > 0) {
                // Fallback to groundingSupports if chunks not available
                citationsText = '\n\n📚 **Mənbələr:**\n';
                metadata.groundingSupports.forEach((support, index) => {
                    if (support.segment) {
                        const segmentText = support.segment.text || 
                                         support.segment || 
                                         `Bölmə ${index + 1}`;
                        citationsText += `${index + 1}. ${segmentText}\n`;
                    }
                });
            }
        }

        // Combine response text with citations
        const finalResponse = text + citationsText;

        // Deduct token after successful response
        try {
            await deductToken(req.userId);
            const newBalance = await User.getTokenBalance(req.userId);
            res.json({ response: finalResponse, balance: newBalance });
        } catch (deductError) {
            console.error('Token deduction error:', deductError);
            // Still send response even if deduction fails (log for admin review)
            res.json({ response: finalResponse, balance: req.tokenBalance - 1 });
        }

    } catch (error) {
        console.error('Chat error:', error);
        console.error('Error details:', {
            message: error.message,
            status: error.status,
            statusText: error.statusText
        });
        // Ensure we always return JSON, not HTML
        if (!res.headersSent) {
            res.status(500).json({ 
                error: 'Failed to generate response', 
                details: error.message 
            });
        }
    }
});

// 404 handler
app.use((req, res) => {
  console.log(`404 - ${req.method} ${req.path} not found`);
  res.status(404).json({ error: 'Route not found', path: req.path, method: req.method });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Using File Search Tool with model: ${modelName}`);
    console.log('Available routes:');
    console.log('  GET  /api/health');
    console.log('  POST /api/test');
    console.log('  POST /api/auth/register');
    console.log('  POST /api/auth/login');
    console.log('  GET  /api/auth/me');
    console.log('  POST /api/chat');
});
