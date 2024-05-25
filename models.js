const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

/**
 * @typedef {Object} Genre
 * @property {string} Name - The name of the genre.
 * @property {string} Description - The description of the genre.
 */

/**
 * @typedef {Object} Director
 * @property {string} Name - The name of the director.
 * @property {string} Bio - The biography of the director.
 */

/**
 * @typedef {Object} Movie
 * @property {string} Title - The title of the movie.
 * @property {string} Description - The description of the movie.
 * @property {Genre} Genre - The genre of the movie.
 * @property {Director} Director - The director of the movie.
 * @property {string[]} Actors - An array of actors in the movie.
 * @property {string} ImageURL - The URL of the movie's image.
 * @property {boolean} Featured - Whether the movie is featured.
 */
let movieSchema = mongoose.Schema({
  Title: { type: String, required: true },
  Description: { type: String, required: true },
  Genre: {
    Name: String,
    Description: String,
  },
  Director: {
    Name: String,
    Bio: String,
  },
  Actors: [String],
  ImageURL: String,
  Featured: Boolean,
});

/**
 * @typedef {Object} User
 * @property {string} Username - The username of the user.
 * @property {string} Password - The hashed password of the user.
 * @property {string} Email - The email of the user.
 * @property {Date} [Birthday] - The birthday of the user.
 * @property {mongoose.Schema.Types.ObjectId[]} FavoriteMovies - An array of favorite movies' IDs.
 */
let userSchema = mongoose.Schema({
  Username: { type: String, required: true },
  Password: { type: String, required: true },
  Email: { type: String, required: true },
  Birthday: Date,
  FavoriteMovies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }],
});

/**
 * Hashes a password using bcrypt.
 * @function
 * @param {string} password - The password to hash.
 * @returns {string} The hashed password.
 */
userSchema.statics.hashPassword = (password) => {
  return bcrypt.hashSync(password, 10);
};

/**
 * Validates a password with the hashed password.
 * @function
 * @param {string} password - The password to validate.
 * @returns {boolean} True if the password is valid, false otherwise.
 */
userSchema.methods.validatePassword = function (password) {
  return bcrypt.compareSync(password, this.Password);
};

let Movie = mongoose.model('Movie', movieSchema);
let User = mongoose.model('User', userSchema);

module.exports.Movie = Movie;
module.exports.User = User;
