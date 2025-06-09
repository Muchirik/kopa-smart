//MPESA integration

const axios = require('axios');
const { getAuthToken } = require('../config/daraja');
const { Timestamp } = require('firebase-admin/firestore');

const initiateSTKPush = async (phone, amount, accountReference) => {
    const token = await getAuthToken();
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '');

    const response = await axios.post(
        'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
        {
            BusinessShortCode: '174379',
            Password: btoa(`174379${process.env.MPESA_PASSKEY}${timestamp}`),
            Timestamp: timestamp,
            TransctionType: 'CustomerPayBillOnline',
            Amount: amount,
            PartyA: phone,
            PartyB: '174379',
            PhoneNumber: phone,
            CallBackURL: 'https://your-calllback-url.com',
            AccountReference: accountReference,
            TransactionDesc: 'Lipa Pole Pole Repayment'
        },
        { headers: { Authorization: `Bearer ${token}`} }
    );

    return response.data;
};

module.exports = { initiateSTKPush };