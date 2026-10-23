// Task1: initiate app and run server at 3000
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const path=require('path');
app.use(express.static(path.join(__dirname+'/dist/FrontEnd')));
app.use(express.static(path.join(__dirname, 'dist', 'Frontend')));
// Task2: create mongoDB connection 
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI || MONGODB_URI.includes('<username>')) {
    console.warn('Warning: MONGODB_URI is not configured with real credentials in .env.');
} else {
    mongoose.connect(MONGODB_URI)
        .then(() => {
            console.log('Successfully connected to MongoDB Atlas');
        })
        .catch((err) => {
            console.error('MongoDB Atlas connection error:', err.message);
        });
}

// Employee Schema & Model
const employeeSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    position: { type: String, required: true, trim: true },
    salary: { type: Number, required: true, min: 0 }
}, { versionKey: false });

const Employee = mongoose.model('Employee', employeeSchema);

// Validation helper for employee data
function validateEmployeeData(data) {
    const { name, location, position, salary } = data;
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return 'A valid employee name is required';
    }
    if (!location || typeof location !== 'string' || location.trim() === '') {
        return 'A valid office location is required';
    }
    if (!position || typeof position !== 'string' || position.trim() === '') {
        return 'A valid job position is required';
    }
    const numSalary = Number(salary);
    if (salary === undefined || salary === null || isNaN(numSalary) || numSalary < 0) {
        return 'A valid non-negative salary is required';
    }
    return null;
}

//Task 2 : write api with error handling and appropriate api mentioned in the TODO below

//TODO: get data from db  using api '/api/employeelist'
app.get('/api/employeelist', async (req, res) => {
    try {
        const employees = await Employee.find();
        res.status(200).json(employees);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving employees', error: error.message });
    }
});

//TODO: get single data from db  using api '/api/employeelist/:id'
app.get('/api/employeelist/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid employee ID format' });
        }

        const employee = await Employee.findById(id);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        res.status(200).json(employee);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving employee', error: error.message });
    }
});

//TODO: send data from db using api '/api/employeelist'
//Request body format:{name:'',location:'',position:'',salary:''}
app.post('/api/employeelist', async (req, res) => {
    try {
        const validationError = validateEmployeeData(req.body);
        if (validationError) {
            return res.status(400).json({ message: validationError });
        }

        const newEmployee = new Employee({
            name: req.body.name.trim(),
            location: req.body.location.trim(),
            position: req.body.position.trim(),
            salary: Number(req.body.salary)
        });

        const savedEmployee = await newEmployee.save();
        res.status(201).json(savedEmployee);
    } catch (error) {
        res.status(500).json({ message: 'Error adding employee', error: error.message });
    }
});

//TODO: delete a employee data from db by using api '/api/employeelist/:id'
app.delete('/api/employeelist/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid employee ID format' });
        }

        const deletedEmployee = await Employee.findByIdAndDelete(id);
        if (!deletedEmployee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        res.status(200).json({ message: 'Employee deleted successfully', employee: deletedEmployee });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting employee', error: error.message });
    }
});

//TODO: Update  a employee data from db by using api '/api/employeelist'
//Request body format:{name:'',location:'',position:'',salary:''}
app.put('/api/employeelist', async (req, res) => {
    try {
        const id = req.body._id || req.body.id;
        if (!id) {
            return res.status(400).json({ message: 'Employee ID is required for update' });
        }
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid employee ID format' });
        }

        const validationError = validateEmployeeData(req.body);
        if (validationError) {
            return res.status(400).json({ message: validationError });
        }

        const updatedEmployee = await Employee.findByIdAndUpdate(
            id,
            {
                name: req.body.name.trim(),
                location: req.body.location.trim(),
                position: req.body.position.trim(),
                salary: Number(req.body.salary)
            },
            { new: true, runValidators: true }
        );

        if (!updatedEmployee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        res.status(200).json(updatedEmployee);
    } catch (error) {
        res.status(500).json({ message: 'Error updating employee', error: error.message });
    }
});

//! dont delete this code. it connects the front end file.
app.get('/*', function (req, res) {
    res.sendFile(path.join(__dirname + '/dist/Frontend/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
