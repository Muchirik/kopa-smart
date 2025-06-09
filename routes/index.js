//USSD Endpoint

const express = require('express');
const USSDController = require('../controllers/ussd');

const router = express.Router();

router.post('/ussd', async (req, res) => {
    const { phoneNumber, text } = req.body;
    const response = await USSDController.processInput(phoneNumber, text);
    res.send(response);
});

module.exports = router;