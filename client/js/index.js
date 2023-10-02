const joinForm = document.getElementById('join-form');

joinForm.addEventListener('submit', (e) => {
    // For preventing the default behvaviour of Event
    e.preventDefault();

    const username = document.getElementById('username');
    const mobile = document.getElementById('mobile');
    const password = document.getElementById('password');

    if (!validateMobile(mobile.value.trim()))
        alert("Enter Valid Phone Number");
    else if (!validatePassword(password.value)) {
        debugger
        const msg = "Password must contain atleast 8 characters including  1 uppercase letter,1 lowercase letter,1 digit,1 special character (!@#$%&*()\-+=^)";
        alert(msg);
    }
    else {
        debugger
        authenticateUser(username.value, mobile.value, password.value)
    }
})

function validateMobile(mobile) {
    const regex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
    return regex.test(mobile);
}

function validatePassword(password) {
    const regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%&*()\-+=^]).{8,20}$/;
    return regex.test(password);
}

function authenticateUser(username, mobile, password) {
    fetch('http://localhost:9000/authenticate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, mobile, password })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success === true) {
                // debugger
                //Redirect to chat.html
                // window.location.href = `chat.html?username=${encodeURIComponent(username)}&mobile=${encodeURIComponent(mobile)}`
                sessionStorage.setItem("authenticated", true);
                sessionStorage.setItem("username", username);
                sessionStorage.setItem("mobile", mobile);

                window.location.href = `chat.html`
                // joinForm.submit();
            } else {
                // alert('Phone number already taken by some other user.');
                alert('Invalid Credentials')
            }
        })
        .catch(error => console.error('Error during autentication:', error));
}

// window.addEventListener("unload", () => {
//     sessionStorage.clear();
// })