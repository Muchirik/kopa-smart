//USSD Endpoint

const express = require('express');
const USSDController = require('../controllers/ussd');
const router = express.Router();
const { Timestamp } = require('firebase-admin/firestore');
const db = require('../config/firebase');

// USSD Endpoint
//const  ussdRouter = express.Router();
// This endpoint will handle USSD requests

router.post('/ussd', async (req, res) => {
    const { phoneNumber, text } = req.body;
    const response = await USSDController.processInput(phoneNumber, text);
    res.send(response);
});

// M-Pesa Callback Endpoint
//const mpesaRouter = express.Router();
router.post('mpesa/callback', async (req, res) => {
  // Handle the callback from M-Pesa STK Push here
  // This endpoint will receive the callback data from M-Pesa after a successful STK Push
  // log the response or save it to database
  console.log("M-Pesa Callback:", req.body);
  //save the callback data to Firestore. (NOTE to self: I have to make sure Firestore instance set up)
  await db.collection("mpesaCallbacks").add({
    ...req.body,
    timestamp: Timestamp.now(),
  });
  // Respond to M-Pesa to acknowledge receipt of the callback
  const response = {
    ResultCode: 0,
    ResultDesc: "Success",
  };
  res.status(200).json(response);
})

module.exports = router;
// Export the router to be used in the main app