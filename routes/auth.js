require('dotenv').config();
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const passport = require('../config/passport');
const User = require('../models/User');
const validators = require('../validators/validators');

//REGISTER USER
router.post('/register', (req, res) => {
  const newUser = {
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword
  };

  const { errors, isValid } = validators.validateRegisterData(newUser);

  if (!isValid) {
    res.status(400).json(errors);
  }

  User.findOne({ username: newUser.username }).then(user => {
    if (user) {
      res.status(400).json({ username: 'Username already in use' });
    } else {
      const userCredentials = new User({ username: req.body.username, email: req.body.email, password: req.body.password });
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(userCredentials.password, salt, (err, hash) => {
          if (err) {
            console.log(err);
          }
          userCredentials.password = hash;
          userCredentials
            .save()
            .then(user => {
              res.status(201).json(user);
            })
            .catch(err => console.log(err));
        });
      });
    }
  });
});

router.post('/login', (req, res) => {
  const userDetails = {
    email: req.body.email,
    password: req.body.password
  };

  const { errors, isValid } = validators.validateLoginData(userDetails);

  if (!isValid) {
    res.status(400).json(errors);
  }

  User.findOne({ email: userDetails.email }).then(user => {
    if (!user) {
      res.status(403).json({ general: 'Incorrect email or password, please try again.' });
    }
    bcrypt.compare(userDetails.password, user.password).then(isMatch => {
      if (!isMatch) {
        res.status(403).json({ general: 'Incorrect email or password, please try again.' });
      } else {
        const payload = {
          id: user.id,
          username: user.username
        };

        jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: 2155926 }, (err, token) => {
          if (err) {
            console.log(err);
          }
          res.status(201).json({ success: true, token: `Bearer ${token}` });
        });
      }
    });
  });
});

module.exports = router;
