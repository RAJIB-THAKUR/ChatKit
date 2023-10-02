//-----------------------------------------------------------------------------
//------------------------USERS SERVER SIDE DATABASE---------------------------
//-----------------------------------------------------------------------------

const users = [];

//Join user to chat
function userJoin(id, username, mobile, password, chatHistory, contacts, online) {
    const user = { id, username, mobile, password, chatHistory, contacts, online };
    users.push(user);
    return user;
}

function updateUserID_ByMobile(id, mobile) {
    const userIndex = users.findIndex(user => user.mobile === mobile);
    if (userIndex !== -1) {
        users[userIndex].id = id;
        return true;
    }
    return false;
}

function getUserById(id) {
    return users.find(user => user.id === id);
}

function getUserByMobile(mobile) {
    return users.find(user => user.mobile === mobile);
}

function storeChat(chat, userMobile) {
    const user = users.find(user => user.mobile === userMobile)
    user.chatHistory.push(chat);
}

function getOldChats(userMobile, recipientMobile) {
    const user = users.find(user => user.mobile === userMobile);
    //chat with other person (not self)
    if (userMobile !== recipientMobile) {
        if (user) {
            //Condition inside implies recipientMobile must be either sender or receiver
            const chat = user.chatHistory.filter(chat => chat.recipientMobile === recipientMobile || chat.senderMobile === recipientMobile);
            return chat;
        }
    } else {//Chat with self
        if (user) {
            //Condition inside implies recipientMobile must be that of sender itself
            const chat = user.chatHistory.filter(chat => chat.recipientMobile === recipientMobile && chat.senderMobile === recipientMobile);
            return chat;
        }
    }
}

function checkMobile(mobile) {
    const user = users.find(user => user.mobile === mobile);
    if (user)
        return user;
    else
        return false;
}

function checkNameMobile(username, mobile) {
    const user = users.find(user =>
        user.mobile === mobile && user.username === username);
    if (user)
        return user;
    else
        return false;
}

function searchUsers(searchInput) {
    return users.filter(
        user =>
            user.mobile.toLowerCase().includes(searchInput.toLowerCase()) ||
            user.username.toLowerCase().includes(searchInput.toLowerCase()));
}

function addToContacts(userMobile, contactMobile, contactName) {
    const user = users.find(user => user.mobile === userMobile);
    //Second condition is just to ensure he does not add himself in his contact
    if (user && userMobile !== contactMobile) {
        //If mobile is not in the users contact List add him
        if (!(contactMobile in user.contacts)) {
            user.contacts[contactMobile] = { name: contactName, unreadMsgCount: 0 }
        }

        return true;
    }
    return false;
}

function updateUnreadMsgCount(userMobile, contactMobile, updateToZero) {
    const user = checkMobile(userMobile);
    let contactDetails;
    if (user)
        contactDetails = user.contacts[contactMobile];

    if (contactDetails) {
        if (updateToZero) {
            contactDetails.unreadMsgCount = 0
        } else {
            contactDetails.unreadMsgCount++;
        }
    }
}

function getUserContacts(mobile) {
    const user = users.find(user => user.mobile === mobile);
    if (user) {
        return user.contacts;
    }
}

function updateOnline_ByMobile(onlineStatus, mobile) {
    const user = checkMobile(mobile);
    if (user) {
        user.online = onlineStatus;
        return true;
    }
    return false;
}

function updateOnline_ByID(onlineStatus, id) {
    const user = getUserById(id);
    if (user) {
        user.online = onlineStatus;
        return true;
    }
    return false;
}

function getAllOnlineUsers() {
    const onlineUsers = users.filter(user => user.online === true);
    const onlineUsersMobile = onlineUsers.map(user => user.mobile);
    return onlineUsersMobile;
}

module.exports = {
    userJoin,
    getUserById,
    getUserByMobile,
    storeChat,
    getOldChats,
    checkMobile,
    checkNameMobile,
    updateUserID_ByMobile,
    searchUsers,
    addToContacts,
    updateUnreadMsgCount,
    getUserContacts,
    updateOnline_ByMobile,
    getAllOnlineUsers,
    updateOnline_ByID
}