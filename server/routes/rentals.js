const express = require('express');
const router = express.Router();
const Rental = require('../models/rental');
const MongooseHelpers = require('../helpers/mongoose');
const User = require('../models/user');


const userctrl = require('../controllers/user')

router.get('/secret', userctrl.authMiddleware, function(req, res){
    res.json({"secret": true})
})

router.get('/:id', function(req, res){
    const rentalId = req.params.id;

    Rental.findById(rentalId)
        .populate('user', 'username -_id')
        .populate('bookings', 'startAt endAt -_id')
        .exec(function(err, foundRental){
            if(err){
                return res.status(422).send({errors: [{title: 'Rental Error', detail: 'Could not find Rental'}]})
            }
           return res.json(foundRental)
        })

    
 })



router.get('', function(req, res){
    const city = req.query.city;
    const query = city ? {city: city.toLowerCase()} : {};
    
    Rental.find(query)
            .select('-bookings')
            .exec(function(err, foundRentals){
        if(err){
            return res.status(422).send({errors: MongooseHelpers.normalizeErrors(err.errors)})
        }
        if(city && foundRentals.length === 0){
            return res.status(422).send({errors: [{title: 'No Rentals found', detail: `There are no rentals for city ${city}`}]})
        }
        
        return res.json(foundRentals)
    })
    

   
})

router.post('', userctrl.authMiddleware, function(req, res){
    const {title, city, street, category, image, shared, bedrooms, description, dailyRate} = req.body;
    const user = res.locals.user;
    const rental = new Rental({title, city, street, category, image, shared, bedrooms, description, dailyRate});
    rental.user = user;

    Rental.create(rental, function(err, newRental){
        if(err){
            return res.status(422).send({errors: MongooseHelpers.normalizeErrors(err.errors)})
        }

        User.update({_id: user.id}, {$push: {rentals: newRental}}, function(){})
        return res.json(newRental);
    })




})



module.exports = router;