const africastalking = require('africastalking')({
    apiKey: process.env.AT_API_KEY,
    username: process.env.AT_USERNAME
});

const sendSMS = async (phone, message) => {
    try {
        await africastalking.SMS.send({
            to: phone,
            message: message
        });
    } catch (error) {
        console.error('SMS error:', error);
    }
};

module.exports = { sendSMS };