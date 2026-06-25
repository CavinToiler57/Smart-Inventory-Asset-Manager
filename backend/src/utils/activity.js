import {pool} from '../config/database.js';

export const createActivity = async ({
	action,
	entityType,
	entityId = null,
	details = {},
	userId = null,
}) => {
	try {
		await pool.query(
			`INSERT INTO activity_logs (
				user_id,
				action,
				entity_type,
				entity_id,
				details
			)
			VALUES ($1, $2, $3, $4, $5)`,
			[
				userId,
				action,
				entityType,
				entityId,
				JSON.stringify(details),
			],
		);
	} catch (error) {
		console.error('Could not save activity log:', error.message);
	}
};