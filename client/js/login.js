const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', async function(event) {

    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const message = document.getElementById('message');

    try {

        const response = await fetch(
            'http://localhost:3000/api/auth/login',
            {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify({
                    email: email,
                    password: password
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            message.textContent = data.message;
            return;
        }

        // Save login information
        localStorage.setItem('token', data.token);

        localStorage.setItem(
            'user',
            JSON.stringify(data.user)
        );

        // Redirect according to role
        if (data.user.role === 'student') {

            window.location.href = 'student.html';

        } else if (data.user.role === 'instructor') {

            window.location.href = 'instructor.html';

        } else if (data.user.role === 'admin') {

            window.location.href = 'admin.html';

        } else {

            message.textContent = 'Invalid user role.';
        }

    } catch (error) {

        console.error(error);

        message.textContent = 'Unable to connect to the server.';

    }

});