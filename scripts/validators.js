// Validation Management - handles data validation functions
class ValidatorManager {
    constructor() {
        // Validation rules and patterns
        this.isbnPatterns = {
            isbn10: /^\d{9}[\dX]$/,
            isbn13: /^\d{13}$/
        };
    }

    // ISBN Validation
    validateISBN(isbn) {
        if (!isbn) return true; // ISBN is optional
        
        // Remove hyphens and spaces
        const cleaned = isbn.replace(/[-\s]/g, '');
        
        // Check if it's 10 or 13 digits
        if (cleaned.length === 10) {
            return this.isbnPatterns.isbn10.test(cleaned);
        } else if (cleaned.length === 13) {
            return this.isbnPatterns.isbn13.test(cleaned);
        }
        
        return false;
    }

    // Duplicate Validation
    isISBNDuplicate(isbn, excludeId = null, books = []) {
        if (!isbn) return false;
        
        return books.some(book => 
            book.isbn === isbn && book.id !== excludeId
        );
    }

    isAuthorSurnameDuplicate(author, excludeId = null, books = []) {
        if (!author) return false;
        
        const surname = author.split(' ').pop().toLowerCase();
        return books.some(book => {
            if (book.id === excludeId) return false;
            const bookSurname = book.author.split(' ').pop().toLowerCase();
            return bookSurname === surname;
        });
    }

    // Form Field Validation
    validateRequiredFields(formData) {
        const requiredFields = ['title', 'author', 'status'];
        const missingFields = requiredFields.filter(field => !formData[field] || !formData[field].trim());
        
        return {
            isValid: missingFields.length === 0,
            missingFields: missingFields
        };
    }

    validateFormData(formData) {
        const errors = [];
        
        // Check required fields
        const requiredValidation = this.validateRequiredFields(formData);
        if (!requiredValidation.isValid) {
            errors.push(`Missing required fields: ${requiredValidation.missingFields.join(', ')}`);
        }

        // Validate ISBN if provided
        if (formData.isbn && !this.validateISBN(formData.isbn)) {
            errors.push('Invalid ISBN format. Please enter a valid 10 or 13-digit ISBN.');
        }

        // Validate tags format
        if (formData.tags && typeof formData.tags === 'string') {
            const tags = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
            // Check for empty tags or special characters
            const invalidTags = tags.filter(tag => tag.length === 0 || /[<>{}]/.test(tag));
            if (invalidTags.length > 0) {
                errors.push('Tags contain invalid characters. Please remove special characters.');
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // Book Data Validation
    validateBookData(bookData) {
        return this.validateFormData(bookData);
    }

    // Search Query Validation
    validateSearchQuery(query) {
        if (!query || typeof query !== 'string') {
            return {
                isValid: false,
                error: 'Search query must be a non-empty string'
            };
        }

        // Check for potentially harmful characters
        const harmfulPatterns = /[<>{}]/;
        if (harmfulPatterns.test(query)) {
            return {
                isValid: false,
                error: 'Search query contains invalid characters'
            };
        }

        return {
            isValid: true,
            sanitizedQuery: query.trim()
        };
    }

    // Date Validation
    validateDate(dateString) {
        if (!dateString) return true; // Date is optional
        
        const date = new Date(dateString);
        return !isNaN(date.getTime()) && date instanceof Date;
    }

    // Rating Validation
    validateRating(rating) {
        if (!rating) return true; // Rating is optional
        
        const numRating = parseInt(rating);
        return !isNaN(numRating) && numRating >= 1 && numRating <= 5;
    }

    // Status Validation
    validateStatus(status) {
        const validStatuses = ['to-read', 'reading', 'read'];
        return validStatuses.includes(status);
    }

    // Tags Validation
    validateTags(tags) {
        if (!tags || !Array.isArray(tags)) {
            return {
                isValid: false,
                error: 'Tags must be an array'
            };
        }

        const invalidTags = tags.filter(tag => 
            typeof tag !== 'string' || 
            tag.trim().length === 0 || 
            tag.length > 50 ||
            /[<>{}]/.test(tag)
        );

        if (invalidTags.length > 0) {
            return {
                isValid: false,
                error: 'Tags contain invalid values'
            };
        }

        return {
            isValid: true,
            sanitizedTags: tags.map(tag => tag.trim()).filter(tag => tag)
        };
    }

    // File Validation
    validateJSONFile(file) {
        if (!file) {
            return {
                isValid: false,
                error: 'No file provided'
            };
        }

        if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
            return {
                isValid: false,
                error: 'File must be a JSON file'
            };
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            return {
                isValid: false,
                error: 'File size must be less than 10MB'
            };
        }

        return {
            isValid: true
        };
    }

    // Comprehensive Book Validation
    validateBook(bookData, existingBooks = [], excludeId = null) {
        const validation = this.validateBookData(bookData);
        
        if (!validation.isValid) {
            return validation;
        }

        // Check for duplicates
        if (bookData.isbn && this.isISBNDuplicate(bookData.isbn, excludeId, existingBooks)) {
            return {
                isValid: false,
                errors: ['A book with this ISBN already exists']
            };
        }

        if (this.isAuthorSurnameDuplicate(bookData.author, excludeId, existingBooks)) {
            return {
                isValid: false,
                errors: ['A book by this author already exists']
            };
        }

        return {
            isValid: true
        };
    }
}
