let createError = require('http-errors');
let express = require('express');
let path = require('path');
let logger = require('morgan');
const cors = require('cors');

let indexRouter = require('./routes/index');

let app = express();
const corsOptions = {
  origin: '*',
  methods: 'GET, POST',
  allowedHeaders: ['Content-Type', 'user']
};
app.use(cors(corsOptions));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
