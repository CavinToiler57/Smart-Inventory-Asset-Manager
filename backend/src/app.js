import cors from 'cors';
import express from 'express';
import {pool} from './config/database.js';
import {assetsRouter} from './routes/assets.routes.js';
import {employeesRouter} from './routes/employees.routes.js';
import {assignmentsRouter} from './routes/assignments.routes.js';
import {activityRouter} from './routes/activity.routes.js';

export const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (request, response) => {
	response.json({
		success: true,
		message: 'Smart Inventory API is running',
		timestamp: new Date().toISOString(),
	});
});

app.get('/api/database-test', async (request, response, next) => {
	try {
		const result = await pool.query('SELECT NOW() AS database_time');

		response.json({
			success: true,
			message: 'PostgreSQL database connected successfully',
			databaseTime: result.rows[0].database_time,
		});
	} catch (error) {
		next(error);
	}
});

app.use('/api/assets', assetsRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/assignments', assignmentsRouter);
app.use('/api/activity', activityRouter);

app.use((error, request, response, next) => {
	console.error('Server error:', error);

	response.status(500).json({
		success: false,
		message: 'Something went wrong on the server.',
		error: error.message,
	});
});