# Yoldaş - Chatbot Prototype

## ✅ What's Been Implemented

### Features
- **File Search Tool**: Uses Google Gemini File Search Tool (fully managed RAG system)
- **Smart Document Search**: Automatic chunking, embeddings, and vector search for relevant information
- **Automatic Citations**: File Search Tool provides citations for source documents (e.g., clause numbers)
- **Azerbaijani Language**: All responses in Azerbaijani
- **Mobile-Friendly UI**: Responsive design for all devices
- **Clean Chat Interface**: Text-only chat, no uploads or images
- **Persistent File Store**: Files indexed once, reused across sessions
- **Cost-Effective**: Free storage, pay only $0.15 per 1M tokens for indexing

### Current Status
- ✅ Frontend running on `http://localhost:5173`
- ✅ Backend running on `http://localhost:3001`
- ✅ One-time file indexing via setup script
- ✅ Persistent File Search Store (reuses existing store)

## 🚀 Quick Start

### 1. Install Dependencies

**Backend:**
```bash
cd server
npm install
```

**Frontend:**
```bash
cd client
npm install
```

### 2. Configure API Keys

Create `server/.env` file:
```
GEMINI_API_KEY=your_api_key_here
JWT_SECRET=your_jwt_secret_key_here
FIREBASE_SERVICE_ACCOUNT_PATH=./path/to/serviceAccountKey.json
```

**API Keys:**
- Get Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
- Generate a secure JWT secret (random string)
- **Firebase Setup:** See Firebase Configuration section below

### 3. Index Documents (One-Time Setup)

**Option A: Upload individual files**
```bash
cd server
node setup.js path/to/document1.pdf path/to/document2.pdf
```

**Option B: Upload all PDFs from a directory**
```bash
cd server
node setup.js --dir ./documents
```

The script will:
- Create a File Search Store (or reuse existing if `FILE_SEARCH_STORE_NAME` is in `.env`)
- Upload and index all specified PDF files
- Show you the store name to add to `.env`

**Important:** After first run, add the store name to `server/.env`:
```
GEMINI_API_KEY=your_api_key_here
FILE_SEARCH_STORE_NAME=stores/your-store-id-here
```

This ensures the same store is reused on server restarts.

### 4. Start the Application

**Terminal 1 - Backend:**
```bash
cd server
node server.js
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

### 5. Use the App

1. Open `http://localhost:5173` in your browser
2. Start asking questions in Azerbaijani
3. Get answers with citations from your indexed documents

## 🧪 Testing

1. **Open the app**: Go to `http://localhost:5173`
2. **Ask questions**: Type your question in Azerbaijani and press Enter
3. **View citations**: Answers include source references (e.g., "📚 **Mənbələr:** 1. Document.pdf (2.1.1 maddəsi)")

## ⚠️ Setup & Troubleshooting

### Setting Up API Key

1. **Create `.env` file** in the `server/` directory:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

2. **Get your API key** from [Google AI Studio](https://aistudio.google.com/app/apikey)

3. **Restart the server** after adding the API key

### Common Errors

#### "API key not valid" or "NO KEY FOUND"
- **Cause**: Missing or invalid API key in `.env` file
- **Fix**: 
  - Create `server/.env` file with `GEMINI_API_KEY=your_key`
  - Make sure there are no spaces around the `=` sign
  - Restart the server

#### "Model not found" or "404 Not Found"
- **Cause**: Model name might not be available for your API key/region
- **Fix**: The project uses `gemini-2.5-flash` which supports File Search Tool. Ensure your API key has access to this model.

#### "File Search Store not initialized"
- **Cause**: Store creation failed or server hasn't finished initializing
- **Fix**: 
  - Check server console for initialization messages
  - Ensure API key is valid
  - Wait a few seconds after server start

#### "Cavab alına bilmədi" (Could not get response)
- **Cause**: Server error (check server console for details)
- **Fix**: 
  - Check if API key is valid
  - Ensure Gemini API is enabled in Google Cloud Console
  - Check server console for detailed error messages

### API Key Requirements:
1. **API Key Restrictions**: Your API key might have IP or referrer restrictions
2. **API Not Enabled**: The Gemini API might not be enabled for your project
3. **Billing**: Your Google Cloud project might need billing enabled
4. **Key Type**: Make sure you're using a Gemini API key, not a different Google API key

## 📁 Project Structure

```
Yol yoldashi/
├── client/          # React frontend
│   └── src/
│       ├── App.jsx  # Main chat interface (text-only)
│       └── index.css
├── server/          # Node.js backend
│   ├── server.js    # Express server + Gemini File Search Tool
│   ├── setup.js     # One-time file indexing script
│   ├── .env         # API key + File Search Store name
│   └── package.json # Dependencies (@google/genai SDK)
```

## 🔧 File Search Tool Implementation

This project uses **Gemini File Search Tool** (official implementation per [documentation](https://ai.google.dev/gemini-api/docs/file-search)):
- **Fully Managed RAG**: Automatically handles file chunking, embeddings, and indexing
- **Vector Search**: Uses semantic search to find relevant information from documents
- **Automatic Citations**: Responses include citations showing which parts of documents were used
- **Cost-Effective**: Free storage and query embeddings, pay only $0.15 per 1M tokens for initial indexing
- **Fast Retrieval**: Optimized for sub-2 second query responses
- **Supported Models**: Uses `gemini-2.5-flash` (supports File Search Tool)
- **Persistent Store**: Files indexed once, reused across server restarts

**How it works:**
1. On server startup, checks for existing File Search Store (from `.env`) or creates a new one
2. Files are indexed once via `setup.js` script into the persistent store
3. When querying, the File Search Tool retrieves relevant chunks from the store
4. Model generates responses based on retrieved context with citations
5. Store persists across server restarts (reused via `FILE_SEARCH_STORE_NAME` in `.env`)

## 🔄 Adding New Documents

To add new documents to the existing File Search Store:

1. **Make sure `FILE_SEARCH_STORE_NAME` is in `.env`** (from initial setup)
2. **Run the setup script again:**
   ```bash
   cd server
   node setup.js new-document.pdf
   ```
3. The new document will be added to the existing store
4. No need to restart the server - new documents are immediately available

## 🔥 Firebase Configuration

This project uses Firebase Firestore for user data storage.

### Setup Steps:

1. **Create a Firebase Project:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or select an existing one

2. **Enable Firestore:**
   - In Firebase Console, go to Firestore Database
   - Click "Create database"
   - Start in production mode (or test mode for development)
   - Choose a location

3. **Get Service Account Key:**
   - Go to Project Settings → Service Accounts
   - Click "Generate new private key"
   - Download the JSON file
   - Save it in the `server/` directory (e.g., `server/serviceAccountKey.json`)

4. **Update `.env` file:**
   ```
   FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
   ```

   **Alternative:** You can also set the entire JSON as an environment variable:
   ```
   FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
   ```

5. **Security Rules (Firestore):**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

**Note:** The service account key file should be added to `.gitignore` and never committed to version control.

## 🔧 Next Steps

1. Test with real traffic rules PDFs
2. Implement token/billing system
3. Deploy to production
