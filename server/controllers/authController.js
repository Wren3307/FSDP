import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check that email and password were provided
        if (!email || !password) {
            return res.status(400).json({
                message: 'Please enter your email and password.'
            });
        }

        // Find the user in the updated users table
        const result = await pool.query(
            `SELECT
                id,
                name,
                email,
                password_hash,
                role,
                centre_id,
                membership_status,
                joined_on
             FROM users
             WHERE email = $1`,
            [email.trim().toLowerCase()]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                message: 'Invalid email or password.'
            });
        }

        const user = result.rows[0];

        // Check the password against the stored bcrypt hash
        const passwordMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: 'Invalid email or password.'
            });
        }

        // Prevent inactive students from logging in
        if (
            user.role === 'student' &&
            user.membership_status === 'inactive'
        ) {
            return res.status(403).json({
                message: 'Your membership is inactive. Please contact the administrator.'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user.id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '2h'
            }
        );

        // Send the token and safe user details to the frontend
        return res.status(200).json({
            message: 'Login successful.',
            token: token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                centre_id: user.centre_id,
                membership_status: user.membership_status,
                joined_on: user.joined_on
            }
        });

    } catch (error) {
        console.error('Login error:', error);

        return res.status(500).json({
            message: 'An error occurred while logging in.'
        });
    }
};

export {
    loginUser
};