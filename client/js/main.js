const socket = io();

const body = document.body;
const msgBox = document.getElementById('msg');
const userList = document.getElementById('users');
const chatForm = document.getElementById('chat-form');
const recipent = document.getElementById('recipient');
const leaveBtn = document.getElementById('leave-btn');
const searchInputBox = document.getElementById('search-box');
const chatMessages = document.querySelector('.chat-messages');
const searchResults = document.getElementById('searchResults');
const userNameHeader = document.getElementById('currUserName');
const typingIndicator = document.getElementById('typingIndicator');

const { username, mobile } = getUsernameMobile();
const typingDelay = 300;
const searchingDelay = 500;
const stopTypingDelay = 1000;
const debouncedFetchUsers = debounce(func_emit_search_contacts, searchingDelay);
const debouncedHandleTypingEvent = debounce(func_handleTypingEvent, typingDelay);
const debouncedHandleStopTyping = debounce(func_handleStopTyping, stopTypingDelay);

//------------------------------------------------------------------------------
//----------------------------------FUNCTIONS-----------------------------------
//------------------------------------------------------------------------------

function authenticateUser() {
    const authenticated = sessionStorage.getItem("authenticated");
    if (!authenticated) {
        window.location.href = `https://chatkit-app.onrender.com`;
    }
}

function getUsernameMobile() {
    const currUsername = sessionStorage.getItem("username")
    const currMobile = sessionStorage.getItem('mobile');
    return {
        username: currUsername,
        mobile: currMobile
    }
    // const queryString = window.location.search;
    // const params = new URLSearchParams(queryString);
    // const currUsername = params.get('username');
    // const currMobile = params.get('mobile');
    // return {
    //     username: currUsername,
    //     mobile: currMobile
    // };
}

//Add user name to DOM
function outputUserName() {
    userNameHeader.innerText = `${username}`;
}

function createMessageDiv(message, specialClassNAme) {
    const div = document.createElement('div');
    div.classList.add('message');
    div.classList.add(specialClassNAme);
    div.innerHTML = `<p class="meta"><span> ${message.time}</span></p><p class="text">${message.text}</p>`;
    return div;
}

function insertMessageInDOM(messageDiv) {
    chatMessages.insertBefore(messageDiv, typingIndicator);
}

//Output Messages to user's chat interface
function outputMessage(message) {
    if (message.username === "You") {
        const messageDiv = createMessageDiv(message, 'message-right');
        insertMessageInDOM(messageDiv);
    };

    //Condition so that receiver does not look the message simply on blank screen
    if (recipient.mobile === message.senderMobile && message.username !== "You") {
        const messageDiv = createMessageDiv(message, 'message-left');
        insertMessageInDOM(messageDiv);
    }

    if (recipient.mobile !== message.senderMobile) {

        //When reciver is not chatting with the sender of message, 
        //update the UnreadMsgCount with the sender in receiver's side
        func_emit_update_UnreadMsgCount(mobile, message.senderMobile, false);

        //Updating contact list of user
        func_emit_update_contact_list(mobile);
    }
}

//Adding users to DOM
function outputUsers(users) {
    userList.innerHTML = '';
    users.forEach((user) => {
        const li = document.createElement('li');
        li.innerHTML = user.username;
        li.mobile = user.mobile;
        userList.appendChild(li);
    });

}

function handleUserClick(event) {
    const li_user = event.currentTarget;
    const name = li_user.querySelector('span.contact-name').textContent;
    const unreadBadge = li_user.querySelector('span.badge');


    const newRecipientMobile = li_user.mobile;

    //When you click any username, earlier messages with other user will be deleted
    if (recipient.mobile !== newRecipientMobile) {

        //Remove "selected" class from all list items(users)
        removeSelectedClass_fromContactList();

        //Add "selected" class to selected user
        li_user.classList.add("selected_user");

        hideTypingIndicator();
        debouncedHandleStopTyping(recipient.mobile);
        
        //first clear the user chat interface
        clearChatMessages();

        //Get users old chat with this new user socketID
        func_emit_old_chats({ newRecipientMobile })

        //Set recipent value to selected user
        recipient.value = name;
        recipient.mobile = newRecipientMobile;

        //Update UnreadMsgCount to zero
        func_emit_update_UnreadMsgCount(mobile, newRecipientMobile, true);

        //Updating contact list of user
        func_emit_update_contact_list(mobile);
    }

    //Focusing & Enabling message input box
    focusMsgBox();
    removeReadOnly_MsgBox();

    //Clear search input value
    func_clearSearchBox();
}

//Display Contact List of user
function outputContacts(userContacts, onlineUsersMobile) {

    userList.innerHTML = '';
    for (const mobile in userContacts) {

        const li = document.createElement('li');

        const name = document.createElement('span');
        name.className = "contact-name";
        name.textContent = userContacts[mobile].name;
        li.appendChild(name);
        li.addEventListener("click", handleUserClick);

        if (userContacts[mobile].unreadMsgCount !== 0) {
            const unreadBadge = document.createElement('span');
            unreadBadge.className = 'badge';
            unreadBadge.textContent = userContacts[mobile].unreadMsgCount;
            li.appendChild(unreadBadge);
        }
        if (onlineUsersMobile.includes(mobile)) {
            //Online-Indicator
            const indicator = document.createElement('span');
            indicator.className = "online-indicator";
            li.appendChild(indicator);
        }

        li.mobile = mobile;

        //So that contact's name is selected with whom chat is going 
        if (recipient.mobile === mobile)
            li.classList.add("selected_user");
        userList.appendChild(li);
    }
}

//Clear all the messages from user's chat interface
function clearChatMessages() {
    while (chatMessages.firstChild !== typingIndicator)
        chatMessages.removeChild(chatMessages.firstChild)
}

//Remove "selected_user" class from contact list
function removeSelectedClass_fromContactList() {
    var listItems = userList.getElementsByTagName('li');
    for (var i = 0; i < listItems.length; i++) {
        listItems[i].classList.remove("selected_user");
    }
}

//Add "selected_user" class to a contact
function addSelectedClass_fromContactList(contactMobile) {
    var listItems = userList.getElementsByTagName('li');

    for (var i = 0; i < listItems.length + 1; i++) {
        if (listItems[i].mobile === contactMobile)
            listItems[i].classList.add("selected_user");
    }
}

//Emit search box's input to the server for searching the contacts
function func_emit_search_contacts(searchInput) {
    if (searchInput.length > 0)
        socket.emit('search contacts', { searchInput })
}

//Clear search box value
function func_clearSearchBox() {
    searchInputBox.value = "";
}

//Adding users to DOM
function outputSearchedUsers(users) {
    searchResults.innerHTML = '';
    users.forEach((user) => {
        //Condition to not display own's name
        if (user.mobile !== mobile) {
            const li = document.createElement('li');
            li.socketID = user.id;
            li.innerHTML = user.username;
            li.mobile = user.mobile;
            searchResults.appendChild(li);
        }
    });
}

//Update only new contact to the list (currently not in use)
function updateContactList(contactMobile, contactName) {
    const li = document.createElement('li');
    li.innerHTML = contactName
    li.mobile = contactMobile;
    userList.appendChild(li);
};

//Debouncing used to improve to browser performance...func will not be be called frequently
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

function func_handleTypingEvent() {
    const recipientMobile = recipient.mobile;
    socket.emit('typing', { mobile, recipientMobile });
    debouncedHandleStopTyping(recipientMobile)
}

function func_handleStopTyping(recipientMobile) {
    socket.emit('stopTyping', { mobile, recipientMobile });
}

function showTypingIndicator() {
    typingIndicator.style.display = 'block';
}

function hideTypingIndicator() {
    typingIndicator.style.display = 'none';
}

//Emit search box's input to the server for searching the contacts
function func_emit_update_contact_list(userMobile) {
    socket.emit('update contact list', { mobile: userMobile });
}

function func_emit_update_UnreadMsgCount(userMobile, contactMobile, updateToZero) {
    socket.emit("update UnreadMsgCount", {
        userMobile,
        contactMobile,
        updateToZero
    });
}

function func_emit_old_chats({ newRecipientMobile }) {
    socket.emit('old chats', { newRecipientMobile });
}


function func_emit_addToContacts(userMobile, contactMobile, contactName) {
    socket.emit('add to contacts', { userMobile, contactMobile, contactName });
}

function focusMsgBox() {
    msgBox.focus();
}

function removeReadOnly_MsgBox() {
    msgBox.removeAttribute("readonly");
}

function searchResult_styleDisplay(displayValue) {
    searchResults.style.display = displayValue;
}

//------------------------------------------------------------------------------
//-------------------------INITIAL FUNCTION CALLS-------------------------------
//------------------------------------------------------------------------------

authenticateUser();

outputUserName();

//------------------------------------------------------------------------------
//------------------------------SOCKET EVENTS-----------------------------------
//------------------------------------------------------------------------------

//Join Individual chat
socket.emit('join_Individual_Chat', { username, mobile });

socket.on('userAbsent', () => {
    window.location.href = `https://chatkit-app.onrender.com`;
})

//Message from Server
socket.on('message', message => {

    //Show messages to users
    outputMessage(message);

    //Scroll down when new messages arrive from server
    chatMessages.scrollTop = chatMessages.scrollHeight;
});

//Received users list from server based on the search input by the user
socket.on('searchedUsers', users => {
    outputSearchedUsers(users);
})

//Received user's updated contact list from server
socket.on('outputAllContacts', (userContacts, onlineUsersMobile) => {
    outputContacts(userContacts, onlineUsersMobile);
})

socket.on('userTyping', mobile => {
    const recipientMobile = recipient.mobile;
    //show TypingIndicator to receiver only if recipient is chatting with the same user 
    if (recipientMobile === mobile) {
        showTypingIndicator();
    }
})

socket.on('userStoppedTyping', mobile => {
    const recipientMobile = recipient.mobile;
    if (recipientMobile === mobile) {
        hideTypingIndicator();
    }
})

socket.on('user offline', () => {
    func_emit_update_contact_list(mobile);
})

socket.on('user online', () => {
    func_emit_update_contact_list(mobile);
})

//------------------------------------------------------------------------------
//----------------------------DOM EVENT LISTENERS-------------------------------
//------------------------------------------------------------------------------

//Send the message
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const recipientMobile = recipient.mobile;

    //Emit message to the server
    socket.emit('private message', { recipientMobile, msg: msg.value });

    msg.value = '';

    focusMsgBox();
});

//Handling the part when a user name is clicked from searched User Result
searchResults.addEventListener('click', (event) => {
    if (event.target.tagName === 'LI') {
        const contactMobile = event.target.mobile;
        const contactName = event.target.innerText;

        if (recipient.mobile !== contactMobile) {

            //Add clicked user to contact list of the current user
            func_emit_addToContacts(mobile, contactMobile, contactName);

            //Add current user to contact list of the clicked user also
            func_emit_addToContacts(contactMobile, mobile, username)

            recipient.mobile = contactMobile;
            recipient.value = contactName;

            //Update UnreadMsgCount to zero
            func_emit_update_UnreadMsgCount(mobile, contactMobile, true);

            //Updating contact list of user
            func_emit_update_contact_list(mobile);

            //Updating contact list of clicked user also
            func_emit_update_contact_list(contactMobile)

            hideTypingIndicator();

            //first clear the user chat interface
            clearChatMessages();

            //Get users old chat with this new user socketID
            func_emit_old_chats({ newRecipientMobile: contactMobile });
        }
    }
    func_clearSearchBox();

    //Focusing & Enabling message input box
    focusMsgBox();
    removeReadOnly_MsgBox();

    searchResult_styleDisplay("none");
});

//To make search list disappear
body.addEventListener('click', (event) => {
    if (event.target.id !== 'search-box' && event.target.id !== 'searchResults')
        searchResult_styleDisplay("none");
})

searchInputBox.addEventListener('input', (event) => {
    event.preventDefault();
    const searchInput = searchInputBox.value.trim();

    if (searchInput.length == 0)
        searchResults.innerHTML = '';
    else
        //Using Debouncing to eliminate frequent calls to function
        debouncedFetchUsers(searchInput);
})

searchInputBox.addEventListener('focus', () => {
    if (searchInputBox.value.trim().length === 0)
        searchResults.innerHTML = '';

    searchResult_styleDisplay("block");
})

msgBox.addEventListener('input', (event) => {
    event.preventDefault();
    debouncedHandleTypingEvent();
})

leaveBtn.addEventListener('click', () => {
    const confirmation = confirm('Are you sure you want to leave the chat ?');
    if (confirmation) {
        sessionStorage.clear();
        // window.location = '../index.html';
        window.location.href = `https://chatkit-app.onrender.com`;
    }
})

// window.addEventListener("unload", () => {
//     sessionStorage.clear();
// })