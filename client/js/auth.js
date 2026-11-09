function checkAccess(allowedRole) {

    const token = localStorage.getItem('token');

    const user = JSON.parse(
        localStorage.getItem('user')
    );

    // Check whether user is logged in
    if (!token || !user) {

        window.location.href = 'login.html';
        return;
    }

    // Check whether user's role is allowed
    if (user.role !== allowedRole) {

        alert('Access denied!');

        window.location.href = 'login.html';
        return;
    }
}

// Logout function
function logout() {

    localStorage.removeItem('token');

    localStorage.removeItem('user');

    window.location.href = 'login.html';
}