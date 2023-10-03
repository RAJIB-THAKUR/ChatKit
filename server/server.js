const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const { formatMessage, formatChat } = require('./helpers/messages')

const { userJoin,
    getUserById,
    storeChat,
    getOldChats,
    checkMobile,
    checkNameMobile,
    updateUserID_ByMobile,
    getUserByMobile,
    searchUsers,
    addToContacts,
    updateUnreadMsgCount,
    getUserContacts,
    updateOnline_ByMobile,
    getAllOnlineUsers,
    updateOnline_ByID } = require('./storage/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

//Serve the static files/folder
app.use(express.static(path.join(__dirname, '../client')));

app.post('/authenticate', express.json(), (req, res) => {
    const { username, mobile, password } = req.body;

    const user = checkMobile(mobile);

    //If user not present, register him
    if (!user) {
        userJoin(null, username, mobile, password, [], {}, false);
        res.json({ success: true });
    }
    // Correct Credentials entered by already registered users
    else if (user.username === username && user.password === password)
        res.json({ success: true });
    //Else user not authenticated with provided credentials
    else res.json({ success: false });
});

//Socket.IO connection handling
//Run when the client connects
io.on('connection', socket => {

    //Individual chat
    socket.on('join_Individual_Chat', ({ username, mobile }) => {
        const user = checkNameMobile(username, mobile);
        if (!user) {
            io.to(socket.id).emit('userAbsent');
        }

        updateUserID_ByMobile(socket.id, mobile);
        updateOnline_ByMobile(true, mobile);

        const userContacts = getUserContacts(mobile);
        const onlineUsersMobile = getAllOnlineUsers();

        if (userContacts)
            io.to(user.id).emit('outputAllContacts', userContacts, onlineUsersMobile);

        io.emit("user online");
    });

    //Returns user's contact lists for updating in the DOM
    socket.on('update contact list', ({ mobile }) => {
        const userContacts = getUserContacts(mobile);
        const user = getUserByMobile(mobile);
        const onlineUsersMobile = getAllOnlineUsers();
        if (user && userContacts)
            io.to(user.id).emit('outputAllContacts', userContacts, onlineUsersMobile);
    })

    //Listen for private Message
    socket.on('private message', ({ recipientMobile, msg }) => {

        //To get the current user
        const user = getUserById(socket.id);

        const recipient = getUserByMobile(recipientMobile);
        if (recipient && user) {
            if (user.id !== recipient.id) {

                // Emit the private message to the recipient
                io.to(recipient.id).emit('message', formatMessage(user.mobile, recipientMobile, user.username, msg));

                // Emit the private message to the current user
                io.to(socket.id).emit('message', formatMessage(user.mobile, recipientMobile, "You", msg));

                //Store chat in sender chatHistory
                storeChat(formatChat(user.mobile, recipientMobile, msg), user.mobile);

                //Store chat in receiver chatHistory
                storeChat(formatChat(user.mobile, recipientMobile, msg), recipientMobile);

            }
            else {
                //When user Messages himself
                io.to(user.id).emit('message', formatMessage(user.mobile, recipientMobile, "You", msg));
                storeChat(formatChat(user.mobile, recipientMobile, msg), user.mobile);
            }
        }
    });

    //Listen to old chats
    socket.on('old chats', ({ newRecipientMobile }) => {
        const user = getUserById(socket.id);
        let oldChats;

        if (user)
            oldChats = getOldChats(user.mobile, newRecipientMobile);

        if (oldChats) {
            oldChats.forEach(chat => {
                let senderName = getUserByMobile(chat.senderMobile).username;
                const currentUserName = getUserById(socket.id).username;
                if (senderName === currentUserName)
                    senderName = "You";

                message = {
                    senderMobile: chat.senderMobile,
                    recipientMobile: newRecipientMobile,
                    username: senderName,
                    time: chat.time,
                    text: chat.msg
                }
                io.to(socket.id).emit('message', message);
            });
        }
    });

    //Searching contacts using mobile number
    socket.on('search contacts', ({ searchInput }) => {
        const users = searchUsers(searchInput);
        io.to(socket.id).emit('searchedUsers', users);
    });

    //Add a user to contact list
    socket.on('add to contacts', ({ userMobile, contactMobile, contactName }) => {
        addToContacts(userMobile, contactMobile, contactName);
    });

    socket.on('typing', ({ mobile, recipientMobile }) => {
        const recipent = getUserByMobile(recipientMobile);
        if (recipent)
            io.to(recipent.id).emit('userTyping', mobile);
    });

    socket.on('stopTyping', ({ mobile, recipientMobile }) => {
        const recipent = getUserByMobile(recipientMobile);
        if (recipent)
            io.to(recipent.id).emit('userStoppedTyping', mobile);
    });

    socket.on("update UnreadMsgCount", ({ userMobile, contactMobile, updateToZero }) => {
        updateUnreadMsgCount(userMobile, contactMobile, updateToZero);
    });

    //Run when client disconnects
    socket.on('disconnect', () => {
        updateOnline_ByID(false, socket.id);
        io.emit("user offline");
    });
});

const PORT = 9000 || process.env.PORT;

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})