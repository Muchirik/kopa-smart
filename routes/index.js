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
router.post('/mpesa/callback', async (req, res) => {
  // Handle the callback from M-Pesa STK Push here
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
    // For example, you can update the loan status or notify the user
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

        // You send an SMS notification to the user
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
// Export the router to be used in the main app