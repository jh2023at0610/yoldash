const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Setup script for one-time file indexing into File Search Store
 * 
 * Usage:
 *   node setup.js file1.pdf file2.pdf ...
 *   or
 *   node setup.js --dir ./documents
 */

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

if (!process.env.GEMINI_API_KEY) {
    console.error('ERROR: GEMINI_API_KEY not found in .env file');
    process.exit(1);
}

async function getOrCreateFileSearchStore() {
    const STORE_NAME_ENV = process.env.FILE_SEARCH_STORE_NAME;
    
    // If store name exists in .env, try to use existing store
    if (STORE_NAME_ENV) {
        try {
            const store = await ai.fileSearchStores.get({ name: STORE_NAME_ENV });
            console.log(`✓ Using existing File Search Store: ${STORE_NAME_ENV}`);
            return STORE_NAME_ENV;
        } catch (error) {
            console.log(`Store ${STORE_NAME_ENV} not found, creating new one...`);
        }
    }
    
    // Create new store
    console.log('Creating new File Search Store...');
    const fileSearchStore = await ai.fileSearchStores.create({
        config: { displayName: 'Yoldaş Knowledge Base' }
    });
    
    console.log(`✓ File Search Store created: ${fileSearchStore.name}`);
    console.log(`\n⚠️ IMPORTANT: Add this to your .env file:`);
    console.log(`FILE_SEARCH_STORE_NAME=${fileSearchStore.name}\n`);
    
    return fileSearchStore.name;
}

async function uploadFileToStore(filePath, storeName) {
    const fileName = path.basename(filePath);
    const mimeType = path.extname(filePath).toLowerCase() === '.pdf' 
        ? 'application/pdf' 
        : 'application/octet-stream';
    
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }
    
    console.log(`\n📄 Uploading: ${fileName}...`);
    
    // Create temporary file with ASCII-only name to avoid Unicode path issues
    const tempDir = path.join(__dirname, 'temp_uploads');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Generate a safe ASCII filename (keep original extension)
    const fileExt = path.extname(fileName);
    const safeFileName = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}${fileExt}`;
    const tempFilePath = path.join(tempDir, safeFileName);
    
    let tempFileCreated = false;
    
    try {
        // Copy file to temp location with ASCII name
        fs.copyFileSync(filePath, tempFilePath);
        tempFileCreated = true;
        
        // Upload and import file into File Search Store using temp file
        let operation = await ai.fileSearchStores.uploadToFileSearchStore({
            file: tempFilePath,
            fileSearchStoreName: storeName,
            config: {
                displayName: fileName, // Use original filename for display
                mimeType: mimeType,
            }
        });
        
        // Wait until import/indexing is complete
        while (!operation.done) {
            process.stdout.write('.');
            await new Promise(resolve => setTimeout(resolve, 2000));
            operation = await ai.operations.get({ operation });
        }
        
        if (operation.error) {
            throw new Error(`File indexing failed: ${operation.error.message || 'Unknown error'}`);
        }
        
        console.log(` ✓ ${fileName} indexed successfully`);
        return true;
    } catch (error) {
        console.error(` ✗ Failed to upload ${fileName}: ${error.message}`);
        return false;
    } finally {
        // Clean up temporary file
        if (tempFileCreated && fs.existsSync(tempFilePath)) {
            try {
                fs.unlinkSync(tempFilePath);
            } catch (cleanupError) {
                // Ignore cleanup errors
            }
        }
    }
}

async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('Usage:');
        console.log('  node setup.js file1.pdf file2.pdf ...');
        console.log('  node setup.js --dir ./documents');
        console.log('');
        console.log('This script will:');
        console.log('  1. Create or use existing File Search Store');
        console.log('  2. Upload and index all specified files');
        console.log('  3. Show the store name to add to .env file');
        process.exit(1);
    }
    
    try {
        // Get or create File Search Store
        const storeName = await getOrCreateFileSearchStore();
        
        // Collect files to upload
        let filesToUpload = [];
        
        if (args[0] === '--dir') {
            // Directory mode
            const dirPath = args[1] || './documents';
            if (!fs.existsSync(dirPath)) {
                console.error(`Directory not found: ${dirPath}`);
                process.exit(1);
            }
            
            const files = fs.readdirSync(dirPath);
            files.forEach(file => {
                const filePath = path.join(dirPath, file);
                if (fs.statSync(filePath).isFile() && path.extname(file).toLowerCase() === '.pdf') {
                    filesToUpload.push(filePath);
                }
            });
        } else {
            // File list mode
            filesToUpload = args.filter(arg => fs.existsSync(arg));
        }
        
        if (filesToUpload.length === 0) {
            console.error('No files found to upload');
            process.exit(1);
        }
        
        console.log(`\n📚 Found ${filesToUpload.length} file(s) to index\n`);
        
        // Upload all files
        let successCount = 0;
        let failCount = 0;
        
        for (const filePath of filesToUpload) {
            const success = await uploadFileToStore(filePath, storeName);
            if (success) {
                successCount++;
            } else {
                failCount++;
            }
        }
        
        // Summary
        console.log(`\n\n✅ Summary:`);
        console.log(`   Successfully indexed: ${successCount} file(s)`);
        if (failCount > 0) {
            console.log(`   Failed: ${failCount} file(s)`);
        }
        console.log(`\n✓ File Search Store ready: ${storeName}`);
        console.log(`\nMake sure this is in your .env file:`);
        console.log(`FILE_SEARCH_STORE_NAME=${storeName}`);
        
    } catch (error) {
        console.error('\n✗ Setup failed:', error.message);
        process.exit(1);
    }
}

main();

