# BrainShelf: A Book & Notes Vault

A smart digital library application for cataloging, organizing, and searching your books and notes.

## 🌐 Live Demo

**GitHub Pages URL:** https://owizdom.github.io/smallProto

## ✨ Features

- **📚 Book Management**: Add, edit, and delete books with detailed information
- **🔍 Advanced Search**: Regex-powered search with case-insensitive matching
- **📊 Table View**: Sortable table with Title and Date Added columns
- **📈 Dashboard**: Statistics and 7-day trend chart
- **🏷️ Tagging System**: Organize books with custom tags
- **📱 Responsive Design**: Works on desktop and mobile devices
- **💾 Data Import/Export**: JSON import/export functionality
- **🎨 Match Highlighting**: Search results highlighted with `<mark>` tags

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/owizdom/smallProto.git
   cd smallProto
   ```

2. **Open in browser**
   ```bash
   open index.html
   ```
   Or simply double-click `index.html` to open in your default browser.

3. **Start using**
   - Add your first book in the "Add Book" section
   - Use the search functionality to find books
   - Import test data using the `test-books.json` file

## 🧪 Testing

### Test Data
Import the included `test-books.json` file to test with 21 sample books distributed over 7 days.

### Regex Search Examples
- `^The` - Books starting with "The"
- `fiction|romance` - Books with "fiction" OR "romance" tags
- `\d{4}` - Books with 4-digit numbers
- `^[A-Z][a-z]+ [A-Z][a-z]+` - Authors with first and last name

## 🛠️ Technologies Used

- **HTML5** - Semantic markup
- **CSS3** - Modern styling with CSS Grid and Flexbox
- **Vanilla JavaScript** - No frameworks, pure JS
- **Local Storage** - Data persistence
- **Regex** - Advanced search patterns

## 📁 Project Structure

```
smallProto/
├── index.html          # Main HTML file
├── styles/
│   └── styles.css      # All CSS styles
├── scripts/
│   ├── app.js          # Main application logic
│   ├── state.js        # State management
│   ├── storage.js      # Local storage handling
│   ├── ui.js           # UI management
│   ├── search.js       # Search functionality
│   └── validators.js   # Data validation
├── test-books.json     # Sample data for testing
└── README.md           # This file
```

## 🎯 Key Features Explained

### Three-State Sorting
- **First click**: Sort ascending (A-Z, oldest-newest)
- **Second click**: Sort descending (Z-A, newest-oldest)
- **Third click**: Return to original unsorted state

### Regex Search
- **Enabled by default** with case-insensitive matching
- **Real-time search** as you type
- **Match highlighting** with visual feedback

### Data Import
- **Append-only import** - never overwrites existing data
- **Format flexibility** - handles both full and simplified JSON formats
- **Automatic ID generation** - prevents conflicts

## 📊 Dashboard Features

- **Total Books**: Count of all books in library
- **Total Notes**: Count of books with notes
- **Top Tag**: Most frequently used tag
- **7-Day Chart**: Visual representation of book additions
- **Recent Activity**: Latest book additions and updates

## 🔧 Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 👨‍💻 Author

**GitHub:** [@owizdom](https://github.com/owizdom)  
**Email:** w.okechukwu@alustudent.com

---

**Live Demo:** https://owizdom.github.io/smallProto
