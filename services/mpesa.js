//MPESA integration

const axios = require('axios');
const { getAuthToken } = require('../config/daraja');
const { Timestamp } = require('firebase-admin/firestore');
// MPESA STK Push integration for Lipa Pole Pole repayments
// This module handles the M-Pesa STK Push for loan repayments using the Lipa Pole Pole service


// Function to initiate STK Push

const initiateSTKPush = async (phone, amount, accountReference) => {
    const token = await getAuthToken();
    const now = new Date();
    // Format the timestamp as required by M-Pesa
    const pad = (n) => n < 10 ? `0${n}` + n : n;
    const timestamp = now.getFullYear().toString() +
        pad(now.getMonth() + 1) +
        pad(now.getDate()) +
        pad(now.getHours()) +
        pad(now.getMinutes()) +
        pad(now.getSeconds());
        
    //ensure phone number is in the correct format
    let formattedPhone = phone;
    if (phone.startsWith('0')) {
        formattedPhone = '254' + phone.substring(1);
    } else if (phone.startsWith('+')) {
        formattedPhone = phone.substring(1);
    }

    // Prepare the request to M-Pesa STK Push API
    // Note to self: Replace '174379' with your actual Business Short Code
    // and 'https://sandbox.safaricom.co.ke' with the production URL when going live

    const response = await axios.post(
        'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', // Use 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest' for production
        {
            BusinessShortCode: '174379',
            Password: Buffer.from(`174379${process.env.MPESA_PASSKEY}${timestamp}`).toString('base64'),
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: amount,
            PartyA: phone,
            PartyB: '174379',
            PhoneNumber: phone,
            CallBackURL: 'https://your-calllback-url.com', // Replace with actual callback URL
            // For production, use 'https://api.safaricom.co.ke/mpesa/c2b/v1/safaricom-safaricom-callback'
            AccountReference: accountReference,
            TransactionDesc: 'Lipa Pole Pole Repayment'
        },
        { headers: { Authorization: `Bearer ${token}`} }
    );

    return response.data;
};

module.exports = {
    initiateSTKPush,

 };