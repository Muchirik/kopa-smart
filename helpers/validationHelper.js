function isValidPhone(phone) {
    // accepts 07xxxxxxxx, 2547xxxxxxxx, or +2547xxxxxxxx
    return /^(\+?254|0)7\d{8}$/.test(phone);
}

function normalizePhone(phone) {
    // Converts to 2547xxxxxxxx
    if (phone.startsWith("+")) phone = phone.substring(1);
    if (phone.startsWith("0")) return "254" + phone.substring(1);
    if (phone.startsWith("254")) return phone;
    return phone;
}

function isValidIdNumber(id) {
    return /^d{6,10}$/.test(id);
}

function isValidPin(pin) {
    return /^\d{4}$/.test(pin);
}

function isValidAmount(amount) {
    const num = Number(amount);
    return /^\d+$/.test(amount) && num > 0 && num >= 100 && num <= 1000000;
}

function isValidPeriod(period) {
    const num = Number(period);
    return /^\d+$/.test(period) && num >= 1 && num <= 365;
}

module.exports = {
    isValidPhone,
    isValidPhone,
    isValidIdNumber,
    isValidPin,
    isValidAmount,
    isValidPeriod,
};