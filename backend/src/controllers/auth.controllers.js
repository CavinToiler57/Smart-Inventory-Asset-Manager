import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {z} from 'zod';
import {pool} from '../config/database.js';
import {env} from '../config/env.js';

const loginSchema = z.object({
	email: z.string().email('Please enter a valid email address.'),
	password: z.string().min(1, 'Password is required.'),
});

export const login = async (request, response, next) => {
	try {
		const {email, password} = loginSchema.parse(request.body);

		const result = await pool.query(
			`SELECT id, name, email, password_hash, role
			FROM users
			WHERE email = $1`,
			[email.toLowerCase()],
		);

		const user = result.rows[0];

		if (!user) {
			return response.status(401).json({
				success: false,
				message: 'Invalid email or password.',
			});
		}

		const passwordMatches = await bcrypt.compare(password, user.password_hash);

		if (!passwordMatches) {
			return response.status(401).json({
				success: false,
				message: 'Invalid email or password.',
			});
		}

		const token = jwt.sign(
			{
				userId: user.id,
				email: user.email,
				role: user.role,
			},
			env.jwtSecret,
			{expiresIn: '7d'},
		);

		return response.json({
			success: true,
			message: 'Login successful.',
			token,
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role,
			},
		});
	} catch (error) {
		next(error);
	}
};

export const getCurrentUser = async (request, response, next) => {
	try {
		const result = await pool.query(
			`SELECT id, name, email, role, created_at
			FROM users
			WHERE id = $1`,
			[request.user.userId],
		);

		const user = result.rows[0];

		if (!user) {
			return response.status(404).json({
				success: false,
				message: 'User not found.',
			});
		}

		return response.json({
			success: true,
			user,
		});
	} catch (error) {
		next(error);
	}
};