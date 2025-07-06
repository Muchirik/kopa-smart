const express = require('express');
const USSDController = require('../controllers/ussd');
const router = express.Router();
const { Timestamp } = require('firebase-admin/firestore');
const db = require('../config/firebase');



router.get('/', (req, res) => {
  res.send('Lipa Pole Pole API is running!');
});


// USSD Endpoint
//const  ussdRouter = express.Router();
// This endpoint will handle USSD requests

router.post('/ussd', async (req, res) => {
    console.log("Raw body:", req.body);
    const { phoneNumber, text } = req.body;
    try {
      const response = await USSDController.processInput(phoneNumber, text);
      console.log("Route response:", response);
      res.send(response);
    } catch (err) {
      console.error("USSD route error: ", err);
      res.status(500).send("END Sorry, an error occured. Please try again later.");
    }
});

// M-Pesa Callback Endpoint
//const mpesaRouter = express.Router();
router.post('/mpesa/callback', async (req, res) => {
  // Handle the callback from M-Pesa STK Push
  // This endpoint will receive the callback data from M-Pesa after a successful STK Push
  // log the response or save it to database
  console.log("M-Pesa Callback:", req.body);
  //save the callback data to Firestore. (NOTE to self: I have to make sure Firestore instance set up)
  await db.collection("mpesaCallbacks").add({
    ...req.body,
    timestamp: Timestamp.now(),
  });
  try  {
    // Process the callback data as needed
    // For example, update the loan status or notify the user
    const { Body } = req.body;
    if (Body && Body.stkCallback) {
      const { ResultCode, ResultDesc, CallbackMetadata } = Body.stkCallback;
      if (ResultCode === 0) {
        // Successful payment
        const amount = CallbackMetadata.Item.find(item => item.Name === 'Amount').Value;
        const phoneNumber = CallbackMetadata.Item.find(item => item.Name === 'PhoneNumber').Value;
        console.log(`Payment of Ksh ${amount} received from ${phoneNumber}`);
        // update the loan status in Firestore
        const loanId = CallbackMetadata.Item.find(item => item.Name === 'TransactionID').Value;
        const loanRef = db.collection('loans').doc(loanId);
        await loanRef.update({
          status: 'paid',
          amount: amount,
          updatedDate: Timestamp.now(),
        });

        // Send an SMS notification to the user
        await sendSMS(phoneNumber, `Payment of Ksh ${amount} received successfully.`);
      } else {
        console.error(`Payment failed: ${ResultDesc}`);
      }
    }
  }
    catch (error) {
        console.error("Error processing M-Pesa callback:", error);
        
        res.status(500).json({ error: "Internal Server Error" });
        return;
    }
  // Respond to M-Pesa to acknowledge receipt of the callback
  const response = {
    ResultCode: 0,
    ResultDesc: "Success",
  };
  res.status(200).json(response);
})

module.exports = router;