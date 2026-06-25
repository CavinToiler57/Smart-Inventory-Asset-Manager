import {Router} from 'express';
import {pool} from '../config/database.js';
import {sendEmail} from '../utils/email.js';
import {createActivity} from '../utils/activity.js';

export const assignmentsRouter = Router();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

/*
	Get all asset assignments.
*/
assignmentsRouter.get('/', async (request, response, next) => {
	try {
		const result = await pool.query(`
			SELECT
				asset_assignments.id,
				asset_assignments.assigned_at,
				asset_assignments.returned_at,
				assets.id AS asset_id,
				assets.asset_tag,
				assets.name AS asset_name,
				assets.serial_number,
				employees.id AS employee_id,
				employees.name AS employee_name,
				employees.email AS employee_email,
				employees.department,
				employees.designation
			FROM asset_assignments
			INNER JOIN assets ON assets.id = asset_assignments.asset_id
			INNER JOIN employees ON employees.id = asset_assignments.employee_id
			WHERE asset_assignments.returned_at IS NULL
			ORDER BY asset_assignments.assigned_at DESC
		`);

		response.json({
			success: true,
			count: result.rows.length,
			assignments: result.rows,
		});
	} catch (error) {
		next(error);
	}
});

/*
	Get complete assignment history, including returned assets.
*/
assignmentsRouter.get('/history', async (request, response, next) => {
	try {
		const result = await pool.query(`
			SELECT
				asset_assignments.id,
				asset_assignments.assigned_at,
				asset_assignments.returned_at,
				assets.id AS asset_id,
				assets.asset_tag,
				assets.name AS asset_name,
				assets.serial_number,
				employees.id AS employee_id,
				employees.name AS employee_name,
				employees.email AS employee_email,
				employees.department,
				employees.designation,
				CASE
					WHEN asset_assignments.returned_at IS NULL THEN 'active'
					ELSE 'returned'
				END AS assignment_status
			FROM asset_assignments
			INNER JOIN assets ON assets.id = asset_assignments.asset_id
			INNER JOIN employees ON employees.id = asset_assignments.employee_id
			ORDER BY asset_assignments.assigned_at DESC
		`);

		response.json({
			success: true,
			count: result.rows.length,
			assignments: result.rows,
		});
	} catch (error) {
		next(error);
	}
});

/*
	Assign one asset to one employee.
*/
assignmentsRouter.post('/', async (request, response, next) => {
	const client = await pool.connect();

	try {
		const {assetId, employeeId} = request.body;

		if (!assetId || !employeeId) {
			return response.status(400).json({
				success: false,
				message: 'Asset ID and employee ID are required.',
			});
		}

		await client.query('BEGIN');

		const assetResult = await client.query(
			`SELECT id, name, asset_tag, serial_number, status
			FROM assets
			WHERE id = $1
			FOR UPDATE`,
			[assetId],
		);

		const asset = assetResult.rows[0];

		if (!asset) {
			await client.query('ROLLBACK');

			return response.status(404).json({
				success: false,
				message: 'Asset not found.',
			});
		}

		if (asset.status === 'assigned') {
			await client.query('ROLLBACK');

			return response.status(400).json({
				success: false,
				message: 'This asset is already assigned.',
			});
		}

		if (asset.status === 'retired') {
			await client.query('ROLLBACK');

			return response.status(400).json({
				success: false,
				message: 'Retired assets cannot be assigned.',
			});
		}

		const employeeResult = await client.query(
			`SELECT id, name, email
			FROM employees
			WHERE id = $1 AND is_active = TRUE`,
			[employeeId],
		);

		const employee = employeeResult.rows[0];

		if (!employee) {
			await client.query('ROLLBACK');

			return response.status(404).json({
				success: false,
				message: 'Active employee not found.',
			});
		}

		const assignmentResult = await client.query(
			`INSERT INTO asset_assignments (asset_id, employee_id)
			VALUES ($1, $2)
			RETURNING *`,
			[assetId, employeeId],
		);

		await client.query(
			`UPDATE assets
			SET status = 'assigned', updated_at = CURRENT_TIMESTAMP
			WHERE id = $1`,
			[assetId],
		);

		await client.query('COMMIT');

		await createActivity({
	action: 'asset_assigned',
	entityType: 'assignment',
	entityId: assignmentResult.rows[0].id,
	details: {
		message: `${asset.name} (${asset.asset_tag}) was assigned to ${employee.name}.`,
		assetId: asset.id,
		assetName: asset.name,
		assetTag: asset.asset_tag,
		employeeId: employee.id,
		employeeName: employee.name,
		employeeEmail: employee.email,
	},
});

		/*
			Emails are sent AFTER database commit.
			If email fails, asset assignment will still remain successful.
		*/
		const assignedDate = new Date().toLocaleString();

		const employeeEmailHtml = `
			<h2>Asset Assigned</h2>
			<p>Hello ${employee.name},</p>
			<p>An asset has been assigned to you.</p>

			<table cellpadding="8" cellspacing="0" border="1">
				<tr>
					<td><strong>Asset Name</strong></td>
					<td>${asset.name}</td>
				</tr>
				<tr>
					<td><strong>Asset Tag</strong></td>
					<td>${asset.asset_tag}</td>
				</tr>
				<tr>
					<td><strong>Serial Number</strong></td>
					<td>${asset.serial_number || 'Not available'}</td>
				</tr>
				<tr>
					<td><strong>Assigned On</strong></td>
					<td>${assignedDate}</td>
				</tr>
			</table>

			<p>Please keep this asset safe and report any issue to the IT team.</p>
			<p>Regards,<br />Smart Inventory System</p>
		`;

		const adminEmailHtml = `
			<h2>New Asset Assignment</h2>
			<p>A new asset assignment has been created.</p>

			<table cellpadding="8" cellspacing="0" border="1">
				<tr>
					<td><strong>Employee</strong></td>
					<td>${employee.name}</td>
				</tr>
				<tr>
					<td><strong>Employee Email</strong></td>
					<td>${employee.email}</td>
				</tr>
				<tr>
					<td><strong>Asset Name</strong></td>
					<td>${asset.name}</td>
				</tr>
				<tr>
					<td><strong>Asset Tag</strong></td>
					<td>${asset.asset_tag}</td>
				</tr>
				<tr>
					<td><strong>Serial Number</strong></td>
					<td>${asset.serial_number || 'Not available'}</td>
				</tr>
				<tr>
					<td><strong>Assigned On</strong></td>
					<td>${assignedDate}</td>
				</tr>
			</table>

			<p>Smart Inventory System</p>
		`;

		try {
			await sendEmail({
				to: employee.email,
				subject: `Asset Assigned: ${asset.name}`,
				html: employeeEmailHtml,
			});

			console.log(`Employee assignment email sent to: ${employee.email}`);
		} catch (emailError) {
			console.error(
				`Employee email could not be sent to ${employee.email}:`,
				emailError.message,
			);
		}

		if (ADMIN_EMAIL) {
			try {
				await sendEmail({
					to: ADMIN_EMAIL,
					subject: `New Asset Assigned: ${asset.name}`,
					html: adminEmailHtml,
				});

				console.log(`Admin assignment email sent to: ${ADMIN_EMAIL}`);
			} catch (emailError) {
				console.error(
					`Admin email could not be sent to ${ADMIN_EMAIL}:`,
					emailError.message,
				);
			}
		} else {
			console.log('ADMIN_EMAIL is not set. Admin notification skipped.');
		}

		response.status(201).json({
			success: true,
			message: `${asset.name} has been assigned to ${employee.name}.`,
			assignment: assignmentResult.rows[0],
		});
	} catch (error) {
		await client.query('ROLLBACK');
		next(error);
	} finally {
		client.release();
	}
});

/*
	Return an asset and change its status back to available.
*/
assignmentsRouter.put('/:id/return', async (request, response, next) => {
	const client = await pool.connect();

	try {
		const assignmentId = Number(request.params.id);

		if (!Number.isInteger(assignmentId) || assignmentId < 1) {
			return response.status(400).json({
				success: false,
				message: 'Please provide a valid assignment ID.',
			});
		}

		await client.query('BEGIN');

		const assignmentResult = await client.query(
			`SELECT
				asset_assignments.id,
				asset_assignments.asset_id,
				asset_assignments.returned_at,
				assets.name AS asset_name,
				assets.asset_tag,
				assets.serial_number,
				employees.name AS employee_name,
				employees.email AS employee_email
			FROM asset_assignments
			INNER JOIN assets ON assets.id = asset_assignments.asset_id
			INNER JOIN employees ON employees.id = asset_assignments.employee_id
			WHERE asset_assignments.id = $1
			FOR UPDATE`,
			[assignmentId],
		);

		const assignment = assignmentResult.rows[0];

		if (!assignment) {
			await client.query('ROLLBACK');

			return response.status(404).json({
				success: false,
				message: 'Assignment not found.',
			});
		}

		if (assignment.returned_at) {
			await client.query('ROLLBACK');

			return response.status(400).json({
				success: false,
				message: 'This asset has already been returned.',
			});
		}

		await client.query(
			`UPDATE asset_assignments
			SET returned_at = CURRENT_TIMESTAMP
			WHERE id = $1`,
			[assignmentId],
		);

		await client.query(
			`UPDATE assets
			SET status = 'available', updated_at = CURRENT_TIMESTAMP
			WHERE id = $1`,
			[assignment.asset_id],
		);

		await client.query('COMMIT');

		await createActivity({
	action: 'asset_returned',
	entityType: 'assignment',
	entityId: assignment.id,
	details: {
		message: `${assignment.asset_name} (${assignment.asset_tag}) was returned by ${assignment.employee_name}.`,
		assetId: assignment.asset_id,
		assetName: assignment.asset_name,
		assetTag: assignment.asset_tag,
		employeeName: assignment.employee_name,
		employeeEmail: assignment.employee_email,
	},
});

		const returnedDate = new Date().toLocaleString();

		const employeeReturnEmailHtml = `
			<h2>Asset Returned</h2>
			<p>Hello ${assignment.employee_name},</p>
			<p>The following asset has been marked as returned in the Smart Inventory System.</p>

			<table cellpadding="8" cellspacing="0" border="1">
				<tr>
					<td><strong>Asset Name</strong></td>
					<td>${assignment.asset_name}</td>
				</tr>
				<tr>
					<td><strong>Asset Tag</strong></td>
					<td>${assignment.asset_tag}</td>
				</tr>
				<tr>
					<td><strong>Returned On</strong></td>
					<td>${returnedDate}</td>
				</tr>
			</table>

			<p>Regards,<br />Smart Inventory System</p>
		`;

		try {
			await sendEmail({
				to: assignment.employee_email,
				subject: `Asset Returned: ${assignment.asset_name}`,
				html: employeeReturnEmailHtml,
			});

			console.log(`Employee return email sent to: ${assignment.employee_email}`);
		} catch (emailError) {
			console.error(
				`Employee return email could not be sent to ${assignment.employee_email}:`,
				emailError.message,
			);
		}

		if (ADMIN_EMAIL) {
			try {
				await sendEmail({
					to: ADMIN_EMAIL,
					subject: `Asset Returned: ${assignment.asset_name}`,
					html: `
						<h2>Asset Returned</h2>
						<p><strong>${assignment.employee_name}</strong> returned an asset.</p>
						<p>
							<strong>Asset:</strong> ${assignment.asset_name}<br />
							<strong>Asset Tag:</strong> ${assignment.asset_tag}<br />
							<strong>Returned On:</strong> ${returnedDate}
						</p>
					`,
				});

				console.log(`Admin return email sent to: ${ADMIN_EMAIL}`);
			} catch (emailError) {
				console.error(
					`Admin return email could not be sent to ${ADMIN_EMAIL}:`,
					emailError.message,
				);
			}
		}

		response.json({
			success: true,
			message: `${assignment.asset_name} has been returned and is now available.`,
		});
	} catch (error) {
		await client.query('ROLLBACK');
		next(error);
	} finally {
		client.release();
	}
});