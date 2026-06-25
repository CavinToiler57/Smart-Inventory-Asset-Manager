import jwt from 'jsonwebtoken';
import {env} from '../config/env.js';

export const requireAuth = (request, response, next) => {
	const authorization = request.headers.authorization;

	if (!authorization?.startsWith('Bearer ')) {
		return response.status(401).json({
			success: false,
			message: 'Authentication token is required.',
		});
	}

	const token = authorization.slice(7);

	try {
		request.user = jwt.verify(token, env.jwtSecret);
		next();
	} catch {
		return response.status(401).json({
			success: false,
			message: 'Invalid or expired authentication token.',
		});
	}
};