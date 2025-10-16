// Search Management - handles search and filter functionality
class SearchManager {
    constructor(stateManager, validatorManager) {
        this.stateManager = stateManager;
        this.validatorManager = validatorManager;
        this.searchHistory = [];
        this.maxSearchHistory = 10;
    }

    // Search Books
    searchBooks(query, options = {}) {
        const { useRegex = false, caseInsensitive = true } = options;
        
        // Validate search query
        const validation = this.validatorManager.validateSearchQuery(query);
        if (!validation.isValid) {
            console.warn('Invalid search query:', validation.error);
            return [];
        }

        const searchTerm = validation.sanitizedQuery.trim();
        
        // Add to search history
        this.addToSearchHistory(searchTerm);
        
        if (!searchTerm) {
            return this.getFilteredBooks();
        }

        const allBooks = this.stateManager.getAllBooks();
        
        if (useRegex) {
            // Validate regex pattern
            const regexValidation = this.validatorManager.validateRegexPattern(searchTerm, caseInsensitive);
            if (!regexValidation.isValid) {
                console.warn('Invalid regex pattern:', regexValidation.error);
                return [];
            }
            
            return this.searchWithRegex(allBooks, searchTerm, caseInsensitive);
        } else {
            return this.searchWithText(allBooks, searchTerm, caseInsensitive);
        }
    }

    searchWithText(books, searchTerm, caseInsensitive) {
        const term = caseInsensitive ? searchTerm.toLowerCase() : searchTerm;
        
        return books.filter(book => {
            const searchableText = [
                book.title,
                book.author,
                book.isbn || '',
                book.notes || '',
                ...(book.tags || [])
            ].join(' ');

            const text = caseInsensitive ? searchableText.toLowerCase() : searchableText;
            return text.includes(term);
        });
    }

    searchWithRegex(books, pattern, caseInsensitive) {
        const flags = caseInsensitive ? 'gi' : 'g';
        let regex;
        
        try {
            regex = new RegExp(pattern, flags);
        } catch (error) {
            console.warn('Invalid regex pattern:', error.message);
            return [];
        }

        return books.filter(book => {
            const searchableText = [
                book.title,
                book.author,
                book.isbn || '',
                book.notes || '',
                ...(book.tags || [])
            ].join(' ');

            return regex.test(searchableText);
        });
    }

    // Filter Books
    setFilter(filter) {
        // Validate filter
        if (!this.isValidFilter(filter)) {
            console.warn('Invalid filter:', filter);
            return;
        }

        this.stateManager.setCurrentFilter(filter);
        
        // Update active tab in UI
        this.updateFilterTabs(filter);
        
        return this.getFilteredBooks();
    }

    getFilteredBooks() {
        const currentFilter = this.stateManager.getCurrentFilter();
        return this.stateManager.getBooksByStatus(currentFilter);
    }

    // Filter Validation
    isValidFilter(filter) {
        const validFilters = ['all', 'to-read', 'reading', 'read'];
        return validFilters.includes(filter);
    }

    // UI Updates for Filters
    updateFilterTabs(activeFilter) {
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        const activeTab = document.querySelector(`[data-filter="${activeFilter}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
    }

    // Advanced Search
    advancedSearch(searchCriteria) {
        const {
            query = '',
            status = 'all',
            tags = [],
            dateRange = null,
            rating = null
        } = searchCriteria;

        let results = this.stateManager.getAllBooks();

        // Text search
        if (query.trim()) {
            const validation = this.validatorManager.validateSearchQuery(query);
            if (validation.isValid) {
                const searchTerm = validation.sanitizedQuery.toLowerCase();
                results = results.filter(book => {
                    const searchableText = [
                        book.title,
                        book.author,
                        book.isbn || '',
                        book.notes || '',
                        ...(book.tags || [])
                    ].join(' ').toLowerCase();

                    return searchableText.includes(searchTerm);
                });
            }
        }

        // Status filter
        if (status !== 'all') {
            results = results.filter(book => book.status === status);
        }

        // Tags filter
        if (tags.length > 0) {
            results = results.filter(book => {
                return tags.some(tag => 
                    book.tags && book.tags.some(bookTag => 
                        bookTag.toLowerCase().includes(tag.toLowerCase())
                    )
                );
            });
        }

        // Date range filter
        if (dateRange && dateRange.start && dateRange.end) {
            results = results.filter(book => {
                const bookDate = new Date(book.createdAt);
                const startDate = new Date(dateRange.start);
                const endDate = new Date(dateRange.end);
                
                return bookDate >= startDate && bookDate <= endDate;
            });
        }

        // Rating filter
        if (rating !== null) {
            results = results.filter(book => book.rating >= rating);
        }

        return results;
    }

    // Search History Management
    addToSearchHistory(query) {
        if (!query || query.trim().length === 0) return;
        
        const trimmedQuery = query.trim();
        
        // Remove if already exists
        this.searchHistory = this.searchHistory.filter(item => item !== trimmedQuery);
        
        // Add to beginning
        this.searchHistory.unshift(trimmedQuery);
        
        // Limit history size
        if (this.searchHistory.length > this.maxSearchHistory) {
            this.searchHistory = this.searchHistory.slice(0, this.maxSearchHistory);
        }
        
        // Save to localStorage
        this.saveSearchHistory();
    }

    getSearchHistory() {
        return [...this.searchHistory];
    }

    clearSearchHistory() {
        this.searchHistory = [];
        this.saveSearchHistory();
    }

    saveSearchHistory() {
        localStorage.setItem('bookVault_searchHistory', JSON.stringify(this.searchHistory));
    }

    loadSearchHistory() {
        const stored = localStorage.getItem('bookVault_searchHistory');
        if (stored) {
            try {
                this.searchHistory = JSON.parse(stored);
            } catch (error) {
                console.warn('Failed to load search history:', error);
                this.searchHistory = [];
            }
        }
    }

    // Quick Filters
    getQuickFilters() {
        const books = this.stateManager.getAllBooks();
        
        return {
            recentlyAdded: books
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 5),
            
            highlyRated: books
                .filter(book => book.rating >= 4)
                .sort((a, b) => (b.rating || 0) - (a.rating || 0)),
            
            mostTagged: books
                .filter(book => book.tags && book.tags.length > 0)
                .sort((a, b) => (b.tags.length) - (a.tags.length))
                .slice(0, 5),
            
            withNotes: books.filter(book => book.notes && book.notes.trim()),
            
            byStatus: {
                'to-read': books.filter(book => book.status === 'to-read'),
                'reading': books.filter(book => book.status === 'reading'),
                'read': books.filter(book => book.status === 'read')
            }
        };
    }

    // Search Suggestions
    getSearchSuggestions(query) {
        if (!query || query.trim().length < 2) return [];
        
        const searchTerm = query.toLowerCase().trim();
        const books = this.stateManager.getAllBooks();
        const suggestions = new Set();
        
        books.forEach(book => {
            // Title suggestions
            if (book.title.toLowerCase().includes(searchTerm)) {
                suggestions.add(book.title);
            }
            
            // Author suggestions
            if (book.author.toLowerCase().includes(searchTerm)) {
                suggestions.add(book.author);
            }
            
            // Tag suggestions
            if (book.tags) {
                book.tags.forEach(tag => {
                    if (tag.toLowerCase().includes(searchTerm)) {
                        suggestions.add(tag);
                    }
                });
            }
        });
        
        return Array.from(suggestions).slice(0, 10);
    }

    // Statistics for Search
    getSearchStats() {
        const books = this.stateManager.getAllBooks();
        
        return {
            totalBooks: books.length,
            searchableFields: {
                titles: books.map(book => book.title).length,
                authors: [...new Set(books.map(book => book.author))].length,
                tags: [...new Set(books.flatMap(book => book.tags || []))].length,
                notes: books.filter(book => book.notes && book.notes.trim()).length
            },
            averageTagsPerBook: books.reduce((sum, book) => sum + (book.tags?.length || 0), 0) / books.length,
            booksWithNotes: books.filter(book => book.notes && book.notes.trim()).length
        };
    }

    // Sorting functionality
    sortBooks(books, sortBy, sortOrder = 'asc') {
        const sortedBooks = [...books];
        
        sortedBooks.sort((a, b) => {
            let aValue, bValue;
            
            switch (sortBy) {
                case 'title':
                    aValue = a.title.toLowerCase();
                    bValue = b.title.toLowerCase();
                    break;
                case 'author':
                    aValue = a.author.toLowerCase();
                    bValue = b.author.toLowerCase();
                    break;
                case 'date':
                    aValue = new Date(a.createdAt);
                    bValue = new Date(b.createdAt);
                    break;
                case 'pages':
                    aValue = parseInt(a.pages) || 0;
                    bValue = parseInt(b.pages) || 0;
                    break;
                case 'rating':
                    aValue = parseInt(a.rating) || 0;
                    bValue = parseInt(b.rating) || 0;
                    break;
                case 'status':
                    aValue = a.status;
                    bValue = b.status;
                    break;
                default:
                    return 0;
            }
            
            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
        
        return sortedBooks;
    }

    // Highlight search matches
    highlightMatches(text, pattern, useRegex = false, caseInsensitive = true) {
        if (!pattern || !text) return text;
        
        let regex;
        
        if (useRegex) {
            try {
                const flags = caseInsensitive ? 'gi' : 'g';
                regex = new RegExp(pattern, flags);
            } catch (error) {
                console.warn('Invalid regex pattern for highlighting:', error.message);
                return text;
            }
        } else {
            const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const flags = caseInsensitive ? 'gi' : 'g';
            regex = new RegExp(escapedPattern, flags);
        }
        
        return text.replace(regex, '<mark>$&</mark>');
    }

    // Initialize search functionality
    init() {
        this.loadSearchHistory();
    }
}
