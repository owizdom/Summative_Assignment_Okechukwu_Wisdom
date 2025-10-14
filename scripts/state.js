// State Management - handles application state and book CRUD operations
class StateManager {
    constructor(storageManager) {
        this.books = [];
        this.currentFilter = 'all';
        this.editingBookId = null;
        this.storageManager = storageManager;
    }

    // Initialize state
    init() {
        this.books = this.storageManager.loadBooks();
    }

    // Book Management
    addBook(bookData) {
        const book = {
            id: Date.now().toString(),
            ...bookData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.books.push(book);
        this.storageManager.saveBooks(this.books);
        return book;
    }

    updateBook(id, bookData) {
        const index = this.books.findIndex(book => book.id === id);
        if (index !== -1) {
            this.books[index] = {
                ...this.books[index],
                ...bookData,
                updatedAt: new Date().toISOString()
            };
            this.storageManager.saveBooks(this.books);
            return this.books[index];
        }
        return null;
    }

    deleteBook(id) {
        this.books = this.books.filter(book => book.id !== id);
        this.storageManager.saveBooks(this.books);
    }

    getBook(id) {
        return this.books.find(book => book.id === id);
    }

    getAllBooks() {
        return this.books;
    }

    // Filter Management
    setCurrentFilter(filter) {
        this.currentFilter = filter;
    }

    getCurrentFilter() {
        return this.currentFilter;
    }

    // Edit Management
    setEditingBookId(id) {
        this.editingBookId = id;
    }

    getEditingBookId() {
        return this.editingBookId;
    }

    clearEditingBookId() {
        this.editingBookId = null;
    }

    // Statistics
    getTotalBooks() {
        return this.books.length;
    }

    getTotalNotes() {
        return this.books.reduce((sum, book) => sum + (book.notes ? 1 : 0), 0);
    }

    getBooksByStatus(status) {
        if (status === 'all') {
            return this.books;
        }
        return this.books.filter(book => book.status === status);
    }

    getRecentBooks(limit = 5) {
        return this.books
            .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
            .slice(0, limit);
    }


    // Data Analysis
    getTopTag() {
        const tagCounts = {};
        
        this.books.forEach(book => {
            if (book.tags && book.tags.length > 0) {
                book.tags.forEach(tag => {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                });
            }
        });
        
        if (Object.keys(tagCounts).length === 0) {
            return 'None';
        }
        
        const topTag = Object.keys(tagCounts).reduce((a, b) => 
            tagCounts[a] > tagCounts[b] ? a : b
        );
        
        return `${topTag} (${tagCounts[topTag]})`;
    }

    getLast7DaysData() {
        const today = new Date();
        const last7Days = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0); // Start of day
            
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);
            
            // Count books added on this day
            const booksAddedToday = this.books.filter(book => {
                const bookDate = new Date(book.createdAt);
                bookDate.setHours(0, 0, 0, 0);
                return bookDate.getTime() === date.getTime();
            }).length;
            
            last7Days.push({
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                count: booksAddedToday
            });
        }
        
        return last7Days;
    }

    // Import/Export
    importBooks(importedBooks) {
        this.books = importedBooks;
        this.storageManager.saveBooks(this.books);
    }

    exportBooks() {
        return this.books;
    }

    // Utility
    refreshFromStorage() {
        this.books = this.storageManager.loadBooks();
    }
}
