//const moment = require('moment');
const moment = require('moment-timezone');

function formatMessage(senderMobile, recipientMobile, username, text) {
    return {
        senderMobile,
        recipientMobile,
        username,
        text,
        //time: moment().format('h:mm a'),
        time: moment().tz('Asia/Kolkata').format('h:mm a')
    }
}

function formatChat(senderMobile, recipientMobile, msg) {
    return {
        senderMobile,
        recipientMobile,
        msg,
        //time: moment().format('h:mm a')
        time: moment().tz('Asia/Kolkata').format('h:mm a')
    }
}

module.exports = { formatMessage, formatChat };