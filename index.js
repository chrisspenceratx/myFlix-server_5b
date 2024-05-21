const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const uuid = require('uuid');
const mongoose = require('mongoose');
const Models = require('./models.js');
const cors = require('cors');
const { check, validationResult } = require('express-validator');
const Movies = Models.Movie;
const Users = Models.User;

mongoose.set("strictQuery", false);
// KEEP THESE HERE FOR EASY ACCESS WHEN MAKING LOCAL CHANGES   //
// mongoose.connect('mongodb://localhost:27017/myFlixDB', { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connect( process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const app = express();
app.use(morgan('common'));
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:4200/welcome',
  'http://localhost:4200',
  'https://spencer-flix-c2b5a70a1e0d.herokuapp.com/',
  'http://localhost:1234',
  'mongodb://localhost:27017/myflixfinderdb',
  'mongodb://localhost:27017',
  'https://spencer-flix.netlify.app'
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        let message =
          "The CORS policy for this application doesn't allow access from origin " +
          origin;
        return callback(new Error(message), false);
      }
      return callback(null, true);
    }
  })
);

let auth = require('./auth')(app);
const passport = require('passport');
require('./passport');
app.get('/', (req, res) => {
  res.send('Welcome to my movie app.');
});
//READ all movies//
app.get(
  '/movies',
  // Now taking the comment away and making active for 3.55 //
  // Temporarily comment out jwt authorization for 3.4.  Now I did it with 2nd branch//
  // passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Movies.find()
      .then((movies) => res.status(200).json(movies))
      .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
      });
  }
);
// READ - with given title, returns a movie. //
app.get(
  '/movies/:Title',
  // passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { Title } = req.params;
    Movies.findOne({ Title })
      .then((movie) => {
        if (movie) {
          res.status(200).json(movie);
        } else {
          res.status(400).json('Movie not found.');
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
      });
  }
);
// READ - Returns director information. //
app.get(
  '/movies/director/:Name',
  // passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { Name } = req.params;
    Movies.findOne({ 'Director.Name': Name })
      .then((movie) => {
        if (movie) {
          res.status(200).json(movie.Director);
        } else {
          res.status(400).json('Director not found.');
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
      });
  }
);
// READ - Returns genre information. //
app.get(
  '/movies/genre/:Name',
  // passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { Name } = req.params;
    Movies.findOne({ 'Genre.Name': Name })
      .then((movie) => {
        if (movie) {
          res.status(200).json(movie.Genre);
        } else {
          res.status(400).json('Genre not found.');
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
      });
  }
);
// CREATE - add a new user to the list of users
//Expect JSON in the format below:
// {
//   Username: String,
//   Password: String,
//   Email: String,
//   Birthday: Date
// }
app.post(
  '/users',
  [
    check('Username', 'Username is required').isLength({ min: 5 }),
    check(
      'Username',
      'Username contains non alphanumeric characters - not allowed.'
    ).isAlphanumeric(),
    check('Password', 'Password is required').not().isEmpty(),
    check('Email', 'Email does not appear to be valid').isEmail(),
  ],
  (req, res) => {
  // checks validationResult for any errors //
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    const hashedPassword = Users.hashPassword(req.body.Password);
    Users.findOne({ Username: req.body.Username })
      .then((user) => {
        if (user) {
          return res.status(400).send(req.body.Username + ' already exists');
        }
        Users.create({
          Username: req.body.Username,
          Password: hashedPassword,
          Email: req.body.Email,
          Birthday: req.body.Birthday,
        })
          .then((user) => res.status(201).json(user))
          .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
          });
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
      });
  }
);
// GET - Get all users
app.get(
  '/users',
  // passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Users.find()
      .then((users) => res.status(201).json(users))
      .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
      });
  }
);
// GET - Get a user by Username
app.get(
  '/users/:Username',
  // passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Users.findOne({ Username: req.params.Username })
      .then((user) => res.status(200).json(user))
      .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
      });
  }
);
// UPDATE - Update a user's info, by Username
/* Expect JSON in this format:
{
  Username: String, (required)
  Password: String, (required)
  Email: String, (required)
  Birthday: Date
}*/
// GET One User by ID
// DELETE User
app.get(
  '/users/:id', 
  passport.authenticate('jwt', { session: false }), 
  async (req, res) => {
   // CONDITION TO CHECK USER AUTHORIZATION
  //  if(req.user.Username !== req.params.Username){
  //   return res.status(400).send('Permission denied');
  //   }
    // CONDITION ENDS
    await Users.findOne({ _id: req.params.id })
      .then((user) => {
        if (!user) {
          res.status(400).send(req.params.Username + ' was not found.');
          res.status(400).send('User with id ' + req.params.id + ' was not found.');
        } else {
          res.status(200).send(user.Username + ' was deleted.');
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  }
);


app.put(
  '/users/:Username',
  [
    check('Username', 'Username is required').isLength({ min: 5 }),
    check(
      'Username',
      'Username contains non alphanumeric characters - not allowed.'
    ).isAlphanumeric(),
    check('Password', 'Password is required').not().isEmpty(),
    check('Email', 'Email does not appear to be valid').isEmail(),
  ],
  // passport.authenticate('jwt', { session: false }),
  (req, res) => {
    // check the validation object if any errors //
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    const hashedPassword = Users.hashPassword(req.body.Password);
    Users.findOneAndUpdate(
      { Username: req.params.Username },
      {
        $set: {
          Username: req.body.Username,
          Password: hashedPassword,
          Email: req.body.Email,
          Birthday: req.body.Birthday,
        },
      },
      { new: true }
    )
      .then((updatedUser) => res.status(200).json(updatedUser))
      .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
      });
  }
);
// CREATE - Add a new movie to user's favorites
app.post(
  '/users/:Username/movies/:MovieID',
  // passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { Username, MovieID } = req.params;
    Users.findOneAndUpdate(
      { Username },
      { $addToSet: { FavoriteMovies: MovieID } },
      { new: true }
    )
      .then((updatedUser) => res.status(201).json(updatedUser))
      .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
      });
  }
);
// DELETE - Remove a movie from favorites from given user //
app.delete(
  '/users/:Username/movies/:MovieID',
  // passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { Username, MovieID } = req.params;
    Users.findOneAndUpdate(
      { Username },
      { $pull: { FavoriteMovies: MovieID } },
      { new: true }
    )
      .then((updatedUser) => res.status(200).json(updatedUser))
      .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
      });
  }
);
// DELETE - Remove a user
app.delete(
  '/users/:Username',
  // passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { Username } = req.params;
    Users.findOneAndRemove({ Username })
      .then((user) => {
        if (!user) {
          res.status(400).send(Username + ' was not found.');
        } else {
          res.status(200).send(Username + ' was deleted.');
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
      });
  }
);
// Handle any errors that might occur //
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('An error occurred on the server.');
});
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log('Listening on Port ' + port);
});