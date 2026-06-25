import {Router} from 'express';
import {pool} from '../config/database.js';
import {createActivity} from '../utils/activity.js';

export const employeesRouter = Router();

// Get all active employees
employeesRouter.get('/', async (request, response, next) => {
	try {
		const result = await pool.query(`
			SELECT id, name, email, department, designation, is_active, created_at
			FROM employees
			WHERE is_active = TRUE
			ORDER BY name ASC
		`);

		response.json({
			success: true,
			count: result.rows.length,
			employees: result.rows,
		});
	} catch (error) {
		next(error);
	}
});

// Add a new employee
employeesRouter.post('/', async (request, response, next) => {
	try {
		const {
			name,
			email = null,
			department = null,
			designation = null,
		} = request.body;

		if (!name?.trim()) {
			return response.status(400).json({
				success: false,
				message: 'Employee name is required.',
			});
		}

		const result = await pool.query(
			`INSERT INTO employees (name, email, department, designation)
			VALUES ($1, $2, $3, $4)
			RETURNING *`,
			[
				name.trim(),
				email?.trim().toLowerCase() || null,
				department?.trim() || null,
				designation?.trim() || null,
			],
		);

		const employee = result.rows[0];

		await createActivity({
			action: 'employee_created',
			entityType: 'employee',
			entityId: employee.id,
			details: {
				message: `New employee "${employee.name}" was added.`,
				employeeName: employee.name,
				email: employee.email,
				department: employee.department,
				designation: employee.designation,
			},
		});

		response.status(201).json({
			success: true,
			message: 'Employee added successfully.',
			employee,
		});
	} catch (error) {
		next(error);
	}
});

/*
	Delete one employee.
	Related assignment records will also be deleted automatically
	because the database foreign key uses ON DELETE CASCADE.
*/
employeesRouter.delete('/:id', async (request, response, next) => {
	try {
		const employeeId = Number(request.params.id);

		if (!Number.isInteger(employeeId) || employeeId < 1) {
			return response.status(400).json({
				success: false,
				message: 'Please provide a valid employee ID.',
			});
		}

		const result = await pool.query(
			`DELETE FROM employees
			WHERE id = $1
			RETURNING id, name, email, department, designation`,
			[employeeId],
		);

		const employee = result.rows[0];

		if (!employee) {
			return response.status(404).json({
				success: false,
				message: 'Employee not found.',
			});
		}

		await createActivity({
			action: 'employee_deleted',
			entityType: 'employee',
			entityId: employee.id,
			details: {
				message: `Employee "${employee.name}" was deleted.`,
				employeeName: employee.name,
				email: employee.email,
				department: employee.department,
				designation: employee.designation,
			},
		});

		response.json({
			success: true,
			message: `${employee.name} has been deleted successfully.`,
			employee,
		});
	} catch (error) {
		next(error);
	}
});