import {Router} from 'express';
import {pool} from '../config/database.js';

export const activityRouter = Router();

activityRouter.get('/', async (request, response, next) => {
	try {
		const limit = Math.min(Number(request.query.limit) || 10, 50);

		const result = await pool.query(
			`SELECT
				id,
				action,
				entity_type,
				entity_id,
				details,
				created_at
			FROM activity_logs
			ORDER BY created_at DESC
			LIMIT $1`,
			[limit],
		);

		response.json({
			success: true,
			count: result.rows.length,
			activities: result.rows,
		});
	} catch (error) {
		next(error);
	}
});