var express = require('express');
var router = express.Router();
var app         = express();
var bodyParser  = require('body-parser');
var morgan      = require('morgan');
var mongoose    = require('mongoose');

var jwt    = require('jsonwebtoken');
var config = require('../config');
var User   = require('../app/models/user');

mongoose.connect(config.database); 
app.set('superSecret', config.secret);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(morgan('dev'));

// route middleware to verify a token
app.use(function(req, res, next) {
	var token = req.body.token || req.query.token || req.headers['x-access-token'];

	// decode token
	if (token) {

		// verifies secret and checks exp
		jwt.verify(token, app.get('superSecret'), function(err, decoded) {      
			if (err) {
		        return res.json({ success: false, message: 'Failed to authenticate token.' });    
			} else {
		        // if everything is good, save to request for use in other routes
		        req.decoded = decoded;    
		        next();
			}
	    });
	} else {
    // if there is no token
    // return an error
		return res.status(403).send({ 
	        success: false, 
	        message: 'No token provided.' 
		});
	}
});

router.get('/adduser', function(req, res) {
	var nick = new User({ 
	    name: 'stanley', 
	    password: '[stanley@node]',
		admin: true 
	});

	// save the sample user
	nick.save(function(err) {
		if (err) throw err;

		console.log('User saved successfully');
		res.json({ success: true });
	});
});

router.get('/', function(req, res) {
	res.json({ message: 'Welcome to the coolest API on earth!' });
});

router.get('/users', function(req, res) {
  User.find({}, function(err, users) {
    res.json(users);
  });
});   

router.post('/authenticate', function(req, res) {
	User.findOne({
		name: req.body.name
	}, function(err, user) {
		if (err) throw err;
		if (!user) {
			res.json({ success: false, message: 'Authentication failed. User not found.' });
		} else if (user) {
		  // check if password matches
			if (user.password != req.body.password) {
				res.json({ success: false, message: 'Authentication failed. Wrong password.' });
			} else {

			    // if user is found and password is right
			    // create a token
			    var token = jwt.sign(user, app.get('superSecret'), {
					expiresInMinutes: 1440 // expires in 24 hours
			    });

			    // return the information including token as JSON
			    res.json({
					success: true,
					message: 'Enjoy your token!',
					token: token
			    });
			}   
		}

	});
});

module.exports = router;
