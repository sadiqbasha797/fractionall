const Car = require('../models/Car');
const logger = require('../utils/logger');

// Create a new car
const createCar = async (req, res) => {
  try {
    const {
      carname,
      color,
      milege,
      seating,
      features,
      brandname,
      price,
      fractionprice,
      tokenprice,
      expectedpurchasedate,
      ticketsavilble,
      totaltickets,
      tokensavailble
    } = req.body;

    const car = new Car({
      carname,
      color,
      milege,
      seating,
      features,
      brandname,
      price,
      fractionprice,
      tokenprice,
      expectedpurchasedate,
      ticketsavilble,
      totaltickets,
      tokensavailble,
      createdBy: req.user.id,
      createdByModel: req.user.role === 'superadmin' ? 'SuperAdmin' : 'Admin'
    });

    await car.save();
    res.status(201).json({ message: 'Car created successfully', car });
  } catch (error) {
    logger(`Error in createCar: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all cars
const getCars = async (req, res) => {
  try {
    const cars = await Car.find();
    res.json(cars);
  } catch (error) {
    logger(`Error in getCars: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get a car by ID
const getCarById = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }
    res.json(car);
  } catch (error) {
    logger(`Error in getCarById: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update a car by ID
const updateCar = async (req, res) => {
  try {
    const {
      carname,
      color,
      milege,
      seating,
      features,
      brandname,
      price,
      fractionprice,
      tokenprice,
      expectedpurchasedate,
      status,
      ticketsavilble,
      totaltickets,
      tokensavailble
    } = req.body;

    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }

    // Check if user is authorized to update this car
    if (car.createdBy.toString() !== req.user.id && req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Not authorized to update this car' });
    }

    const updatedCar = await Car.findByIdAndUpdate(
      req.params.id,
      {
        carname,
        color,
        milege,
        seating,
        features,
        brandname,
        price,
        fractionprice,
        tokenprice,
        expectedpurchasedate,
        status,
        ticketsavilble,
        totaltickets,
        tokensavailble
      },
      { new: true }
    );

    res.json({ message: 'Car updated successfully', car: updatedCar });
  } catch (error) {
    logger(`Error in updateCar: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a car by ID
const deleteCar = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }

    // Check if user is authorized to delete this car
    if (car.createdBy.toString() !== req.user.id && req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Not authorized to delete this car' });
    }

    await Car.findByIdAndDelete(req.params.id);
    res.json({ message: 'Car deleted successfully' });
  } catch (error) {
    logger(`Error in deleteCar: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createCar,
  getCars,
  getCarById,
  updateCar,
  deleteCar
};