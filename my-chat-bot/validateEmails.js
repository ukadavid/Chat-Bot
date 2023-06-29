const validator = require('email-validator');

function validateEmailAddresses(email) {
    return validator.validate(email);
}

module.exports = validateEmailAddresses;
