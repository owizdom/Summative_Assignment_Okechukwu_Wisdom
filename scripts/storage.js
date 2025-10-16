// Storage Management - handles localStorage and file operations
class StorageManager {
    constructor() {
        this.storageKey = 'bookVault_books';
        this.themeKey = 'bookVault_theme';
        this.itemsPerPageKey = 'bookVault_itemsPerPage';
    }

    // Data Management
    loadBooks() {
        const stored = localStorage.getItem(this.storageKey);
        return stored ? JSON.parse(stored) : [];
    }

    saveBooks(books) {
        localStorage.setItem(this.storageKey, JSON.stringify(books));
    }

    // Settings Management
    loadSettings() {
        const theme = localStorage.getItem(this.themeKey) || 'notebook';
        const itemsPerPage = localStorage.getItem(this.itemsPerPageKey) || '20';
        
        document.documentElement.setAttribute('data-theme', theme);
        document.getElementById('theme-select').value = theme;
        document.getElementById('items-per-page').value = itemsPerPage;
    }

    saveSettings() {
        const theme = document.getElementById('theme-select').value;
        const itemsPerPage = document.getElementById('items-per-page').value;
        
        localStorage.setItem(this.themeKey, theme);
        localStorage.setItem(this.itemsPerPageKey, itemsPerPage);
        
        document.documentElement.setAttribute('data-theme', theme);
    }

    // JSON File Management
    exportToJSONFile(books) {
        // Extract only the required fields from each book
        const simplifiedBooks = books.map(book => ({
            id: book.id,
            title: book.title,
            author: book.author,
            isbn: book.isbn || '',
            pages: book.pages || 0,
            tag: book.tags ? book.tags.join(', ') : '',
            dateAdded: book.createdAt
        }));

        const data = {
            books: simplifiedBooks,
            metadata: {
                version: "1.0",
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString(),
                totalBooks: books.length
            }
        };

        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Create a temporary download link
        const a = document.createElement('a');
        a.href = url;
        a.download = 'books-data.json';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    importFromJSONFile(file, onSuccess, onError) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.books && Array.isArray(data.books)) {
                    // Normalize the imported books to ensure they have all required fields
                    const normalizedBooks = this.normalizeImportedBooks(data.books);
                    // Show import options dialog
                    this.showImportOptions(normalizedBooks, onSuccess, onError);
                } else {
                    onError('Invalid JSON file format.');
                }
            } catch (error) {
                onError('Error reading JSON file. Please make sure it\'s a valid JSON file.');
            }
        };
        reader.readAsText(file);
    }

    normalizeImportedBooks(books) {
        return books.map(book => {
            // Handle both simplified export format and full format
            const normalized = {
                id: book.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
                title: book.title || '',
                author: book.author || '',
                isbn: book.isbn || '',
                pages: book.pages || 0,
                status: book.status || 'to-read',
                rating: book.rating || null,
                tags: book.tags || (book.tag ? book.tag.split(',').map(t => t.trim()) : []),
                notes: book.notes || '',
                createdAt: book.createdAt || book.dateAdded || new Date().toISOString(),
                updatedAt: book.updatedAt || new Date().toISOString()
            };
            
            return normalized;
        });
    }

    showImportOptions(importedBooks, onSuccess, onError) {
        const currentBooks = this.loadBooks();
        const importedCount = importedBooks.length;
        const currentCount = currentBooks.length;

        const message = `Found ${importedCount} books to import.\n\n` +
                       `Current library: ${currentCount} books\n` +
                       `Importing: ${importedCount} books\n\n` +
                       `These books will be added to your existing library.`;

        if (confirm(message + '\n\nContinue with import?')) {
            onSuccess(importedBooks);
        }
    }

    viewJSONData(books) {
        // Extract only the required fields from each book
        const simplifiedBooks = books.map(book => ({
            id: book.id,
            title: book.title,
            author: book.author,
            isbn: book.isbn || '',
            pages: book.pages || 0,
            tag: book.tags ? book.tags.join(', ') : '',
            dateAdded: book.createdAt
        }));

        const data = {
            books: simplifiedBooks,
            metadata: {
                version: "1.0",
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString(),
                totalBooks: books.length
            }
        };

        const jsonString = JSON.stringify(data, null, 2);
        
        // Open in new window for easy viewing
        const newWindow = window.open('', '_blank');
        newWindow.document.write(`
            <html>
                <head>
                    <title>Books Data - JSON View</title>
                    <style>
                        body { font-family: monospace; margin: 20px; background: #f5f5f5; }
                        pre { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                        h1 { color: #333; }
                    </style>
                </head>
                <body>
                    <h1>Books Data - JSON Format</h1>
                    <pre>${jsonString}</pre>
                </body>
            </html>
        `);
    }
}
