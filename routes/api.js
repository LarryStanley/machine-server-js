var express = require('express');
var router = express.Router();
var app         = express();
var bodyParser  = require('body-parser');
var morgan      = require('morgan');
var mongoose    = require('mongoose');
var md5			= require('md5');
var moment 		= require('moment');
var jwt    = require('jsonwebtoken');
var config = require('../config');
var User   = require('../app/models/user');
var MoneyHistory = require('../app/models/MoneyHistory')

mongoose.connect(config.database); 
app.set('superSecret', config.secret);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(morgan('dev'));

router.post('/authenticate', function(req, res) {
	User.findOne({
		name: req.body.name
	}, function(err, user) {
		if (err) throw err;
		if (!user) {
			res.json({ success: false, message: 'Authentication failed. User not found.' });
		} else if (user) {
		  // check if password matches
			if (user.password != md5(req.body.password)) {
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

router.post('/adduser', function(req, res) {
	User.findOne({
		name: req.body.name
	}, function(err, user) {
		if (user) {
			res.json({success: false, message: "User name exist."});
		} else {
			var newUser = new User({ 
			    name: req.body.name, 
			    password: md5(req.body.password),
				admin: false 
			});

			// save the sample user
			newUser.save(function(err) {
				if (err) 
					throw err;

				console.log('User saved successfully');
				res.json({ success: true });
			});
		}
	});
});

router.use(function(req, res, next) {
	var token = req.body.token || req.query.token || req.headers['x-access-token'];
	if (token) {
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
		return res.status(403).send({ 
	        success: false, 
	        message: 'No token provided.' 
		});
	}
});

router.get('/', function(req, res) {
	res.json({ message: 'Welcome to the coolest API on earth!'});
});

router.get('/users', function(req, res) {
  User.find({}, function(err, users) {
    res.json(users);
  });
});  

router.post('/record', function(req, res) {

	var newRecord = new MoneyHistory({
		user_id: req.decoded._id,
		user_name: req.decoded.name,
		item: req.body.item,
		amount: req.body.amount,
		location: {
			latitude: req.body.latitude,
	    	longitude: req.body.longitude
		},
		record_time: req.body.time,
		category: req.body.category
	});

	newRecord.save(function(err) {
		if (err) 
			throw err;
		res.json({ success: true, data: newRecord });
	});
});

router.get('/history/', function(req, res) {
	MoneyHistory.find({
		user_id: req.decoded._id
	}, function(err, history) {
		res.json({success: true ,results: history});
	});

});

router.get('/history/today', function(req, res) {
	var today = moment().startOf('day');
	var tomorrow = moment(today).add(1, 'days');

	MoneyHistory.find({
		"time":  {	
			"$gte": today.format(), 
			"$lt": tomorrow.format()
		}
	}, function(err, history) {
		res.json({success: true ,results: history});
	});
});

router.delete('/delete', function(req, res) {
	MoneyHistory.remove({
		_id: req.body.id
	}, function(err) {
		if (err) 
			throw err;
		else
			res.json({success: true});
	});
});

module.exports = router;
