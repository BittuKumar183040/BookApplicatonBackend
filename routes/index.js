let express = require('express');
let router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const booksFilePath = path.join(__dirname, 'assets', 'books.json');
const books = JSON.parse(fs.readFileSync(booksFilePath, 'utf8'));
const booksLength = books.length;

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Book Search Application' });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './routes/assets/images');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
})
const upload = multer({ storage });

const refactorImageAndData = (books) => {
  const formattedBook = books.map(book => {
    if(book.imageLink){
      const imagePath = path.join(__dirname, 'assets', book.imageLink);
      const imageBase64 = fs.readFileSync(imagePath, { encoding: 'base64' });
      return { ...book, imageLink: `data:image/jpeg;base64,${imageBase64}` };
    }else{
      return { ...book, imageLink: "" };
    }
  });
  return formattedBook;
}

router.get('/books/title/:title', (req, res)=>{
  const title = req.params.title;

  if (!title) {
    return res.status(400).json({ message: 'Title parameter is required' });
  }
  const filteredBooks = books.filter(book => book.title.toLowerCase().includes(title.toLowerCase()));
  if (filteredBooks.length === 0) {
    return res.status(404).json({ message: 'No books found for this Title' });
  }
  res.json({pages:1, string:title, books:refactorImageAndData(filteredBooks)});
})

router.get('/books/:quantity/:page', (req, res) => {
  const quantity = req.params.quantity;
  const pageNo = req.params.page;
  console.log(!quantity , isNaN(quantity) , quantity === '0')
  if (!quantity || isNaN(quantity) || quantity === '0') {
    return res.status(400).json({ message: 'Require Valid Quantity Number' });
  }

  const totalPages = Math.ceil(booksLength / quantity);
  
  if (!pageNo || isNaN(pageNo) || pageNo === '0' || pageNo > totalPages) {
    return res.status(400).json({ message: 'Require Valid Page Number' });
  }
  
  const startIndex = (pageNo - 1) * quantity;
  const endIndex = pageNo * quantity;

  const filteredBooks = books.slice(startIndex , endIndex);
  res.json({pages:totalPages, string:"", books:refactorImageAndData(filteredBooks)})
})

router.post('/books', upload.single('file'), (req, res) => {
  const newBook = req.body;
  
  if (!newBook || 
    !newBook.title || 
    !newBook.author ||
    !newBook.pages ||
    !newBook.link ||
    !newBook.language) {
      return res.status(400).json({ message: 'Data not sufficient to process' });
    }
  
  if(!req.file){
    return res.status(400).json({ message: 'File is required.' })
  }
    
  const file = req.file
  if (file.size > 100000) {
    return res.status(413).json({
      message: 'File size exceeds the allowed limit of 100 KB.'
    });
  }

  newBook.imageLink = file.destination.split("/").pop()+"/"+file.filename;
  
  const existingBook = books.find(book => 
    book.title.toLowerCase() === newBook.title.toLowerCase() && 
    book.language.toLowerCase() === newBook.language.toLowerCase()
  );

  if (existingBook) {
    return res.status(409).json({ message: 'Book with this title already exists' });
  }

  books.push(newBook);

  fs.writeFileSync(booksFilePath, JSON.stringify(books, null, 2), 'utf8');

  res.status(201).json({ message: 'Book added successfully', book: newBook });
})

module.exports = router;
