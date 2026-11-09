import jwt from 'jsonwebtoken';

// Verify whether user is logged in
const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                message: 'Access denied. Please log in.'
            });
        }

        const token = authHeader.split(' ')[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;

        next();

    } catch (error) {

        return res.status(401).json({
            message: 'Invalid or expired token.'
        });

    }
};

// Check user's role
const verifyRole = (...allowedRoles) => {

    return (req, res, next) => {

        if (!allowedRoles.includes(req.user.role)) {

            return res.status(403).json({
                message: 'Access denied. You do not have permission.'
            });

        }

        next();
    };

};

// Export functions
export {
    verifyToken,
    verifyRole
};