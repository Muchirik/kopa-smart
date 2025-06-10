//safaricom daraja config
const axios = require('axios');
const btoa = require('btoa');

const getAuthToken = async () => {
    const auth = Buffer.from
    (`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64');
    const { data } = await axios.get(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", //https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials
      { headers: { Authorization: `Basic ${auth}` } }
    );
    return data.access_token;
};

module.exports = {
    getAuthToken,
}