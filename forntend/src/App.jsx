import {useEffect, useState} from 'react';
import './App.css';

const ASSETS_API_URL = 'http://localhost:5000/api/assets';
const EMPLOYEES_API_URL = 'http://localhost:5000/api/employees';
const ASSIGNMENTS_API_URL = 'http://localhost:5000/api/assignments';
const ASSIGNMENT_HISTORY_API_URL = 'http://localhost:5000/api/assignments/history';
const ACTIVITY_API_URL = 'http://localhost:5000/api/activity';

const emptyAssetForm = {
	assetTag: '',
	name: '',
	serialNumber: '',
	status: 'available',
	purchaseDate: '',
	purchaseCost: '',
};

const emptyEmployeeForm = {
	name: '',
	email: '',
	department: '',
	designation: '',
};

const emptyAssignmentForm = {
	assetId: '',
	employeeId: '',
	notes: '',
};

function App() {
	const [assets, setAssets] = useState([]);
	const [employees, setEmployees] = useState([]);
	const [assignments, setAssignments] = useState([]);
	const [assignmentHistory, setAssignmentHistory] = useState([]);
	const [activities, setActivities] = useState([]);

	const [loading, setLoading] = useState(true);
	const [employeeLoading, setEmployeeLoading] = useState(true);
	const [assignmentLoading, setAssignmentLoading] = useState(true);
	const [historyLoading, setHistoryLoading] = useState(true);
	const [activityLoading, setActivityLoading] = useState(true);

	const [error, setError] = useState('');

	const [assetForm, setAssetForm] = useState(emptyAssetForm);
	const [employeeForm, setEmployeeForm] = useState(emptyEmployeeForm);
	const [assignmentForm, setAssignmentForm] = useState(emptyAssignmentForm);

	const [submittingAsset, setSubmittingAsset] = useState(false);
	const [submittingEmployee, setSubmittingEmployee] = useState(false);
	const [submittingAssignment, setSubmittingAssignment] = useState(false);

	const [editingAsset, setEditingAsset] = useState(null);
	const [editingEmployeeId, setEditingEmployeeId] = useState(null);
	const [updating, setUpdating] = useState(false);
	const [assigningAsset, setAssigningAsset] = useState(null);

	const [searchTerm, setSearchTerm] = useState('');
	const [statusFilter, setStatusFilter] = useState('all');

	const loadAssets = async () => {
		try {
			setLoading(true);

			const response = await fetch(ASSETS_API_URL);
			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || 'Could not load assets.');
			}

			setAssets(data.assets || []);
		} catch (error) {
			setError(error.message);
		} finally {
			setLoading(false);
		}
	};

	const loadEmployees = async () => {
		try {
			setEmployeeLoading(true);

			const response = await fetch(EMPLOYEES_API_URL);
			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || 'Could not load employees.');
			}

			setEmployees(data.employees || []);
		} catch (error) {
			setError(error.message);
		} finally {
			setEmployeeLoading(false);
		}
	};

	const loadAssignments = async () => {
		try {
			setAssignmentLoading(true);

			const response = await fetch(ASSIGNMENTS_API_URL);
			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || 'Could not load assignments.');
			}

			setAssignments(data.assignments || []);
		} catch (error) {
			setError(error.message);
		} finally {
			setAssignmentLoading(false);
		}
	};

	const loadAssignmentHistory = async () => {
		try {
			setHistoryLoading(true);

			const response = await fetch(ASSIGNMENT_HISTORY_API_URL);
			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || 'Could not load assignment history.');
			}

			setAssignmentHistory(data.assignments || []);
		} catch (error) {
			setError(error.message);
		} finally {
			setHistoryLoading(false);
		}
	};

	const loadActivities = async () => {
		try {
			setActivityLoading(true);

			const response = await fetch(`${ACTIVITY_API_URL}?limit=10`);
			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || 'Could not load recent activity.');
			}

			setActivities(data.activities || []);
		} catch (error) {
			setError(error.message);
		} finally {
			setActivityLoading(false);
		}
	};

	const refreshAllData = async () => {
		setError('');

		await Promise.all([
			loadAssets(),
			loadEmployees(),
			loadAssignments(),
			loadAssignmentHistory(),
			loadActivities(),
		]);
	};

	useEffect(() => {
		refreshAllData();
	}, []);

	const handleAssetChange = (event) => {
		const {name, value} = event.target;

		setAssetForm((currentForm) => ({
			...currentForm,
			[name]: value,
		}));
	};

	const handleEmployeeChange = (event) => {
		const {name, value} = event.target;

		setEmployeeForm((currentForm) => ({
			...currentForm,
			[name]: value,
		}));
	};

	const handleAssignmentChange = (event) => {
		const {name, value} = event.target;

		setAssignmentForm((currentForm) => ({
			...currentForm,
			[name]: value,
		}));
	};

	const handleAssetSubmit = async (event) => {
		event.preventDefault();

		try {
			setSubmittingAsset(true);
			setError('');

			const response = await fetch(ASSETS_API_URL, {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify({
					...assetForm,
					purchaseCost: assetForm.purchaseCost
						? Number(assetForm.purchaseCost)
						: null,
					purchaseDate: assetForm.purchaseDate || null,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || 'Could not add asset.');
			}

			setAssetForm(emptyAssetForm);
			await refreshAllData();
		} catch (error) {
			setError(error.message);
		} finally {
			setSubmittingAsset(false);
		}
	};

	const handleEmployeeSubmit = async (event) => {
		event.preventDefault();

		try {
			setSubmittingEmployee(true);
			setError('');

			const isEditing = Boolean(editingEmployeeId);

			const response = await fetch(
				isEditing
					? `${EMPLOYEES_API_URL}/${editingEmployeeId}`
					: EMPLOYEES_API_URL,
				{
					method: isEditing ? 'PUT' : 'POST',
					headers: {'Content-Type': 'application/json'},
					body: JSON.stringify(employeeForm),
				},
			);

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || 'Unable to save employee.');
			}

			setEmployeeForm(emptyEmployeeForm);
			setEditingEmployeeId(null);
			await refreshAllData();
		} catch (error) {
			setError(error.message);
		} finally {
			setSubmittingEmployee(false);
		}
	};

const handleEditEmployee = (employee) => {
	setEmployeeForm({
		name: employee.name || '',
		email: employee.email || '',
		department: employee.department || '',
		designation: employee.designation || '',
	});

	setEditingEmployeeId(employee.id);

	document.getElementById('employee-section')?.scrollIntoView({
		behavior: 'smooth',
		block: 'start',
	});
};


	const cancelEmployeeEdit = () => {
		setEditingEmployeeId(null);
		setEmployeeForm(emptyEmployeeForm);
	};

	const handleDeleteAsset = async (id, assetName) => {
		if (!window.confirm(`Delete "${assetName}" permanently?`)) {
			return;
		}

		try {
			setError('');

			const response = await fetch(`${ASSETS_API_URL}/${id}`, {
				method: 'DELETE',
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || 'Could not delete asset.');
			}

			await refreshAllData();
		} catch (error) {
			setError(error.message);
		}
	};

	const handleDeleteEmployee = async (id, employeeName) => {
		if (!window.confirm(`Delete "${employeeName}" permanently?`)) {
			return;
		}

		try {
			setError('');

			const response = await fetch(`${EMPLOYEES_API_URL}/${id}`, {
				method: 'DELETE',
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || 'Could not delete employee.');
			}

			await refreshAllData();
		} catch (error) {
			setError(error.message);
		}
	};

	const handleReturnAsset = async (assignment) => {
		if (
			!window.confirm(
				`Return "${assignment.asset_name}" from "${assignment.employee_name}"?`,
			)
		) {
			return;
		}

		try {
			setError('');

			const response = await fetch(
				`${ASSIGNMENTS_API_URL}/${assignment.id}/return`,
				{
					method: 'PUT',
					headers: {'Content-Type': 'application/json'},
				},
			);

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || 'Could not return asset.');
			}

			await refreshAllData();
		} catch (error) {
			setError(error.message);
		}
	};

	const startEdit = (asset) => {
		setEditingAsset({
			...asset,
			assetTag: asset.asset_tag || '',
			serialNumber: asset.serial_number || '',
			purchaseDate: asset.purchase_date
				? new Date(asset.purchase_date).toISOString().split('T')[0]
				: '',
			purchaseCost: asset.purchase_cost || '',
		});
	};

	const handleEditChange = (event) => {
		const {name, value} = event.target;

		setEditingAsset((currentAsset) => ({
			...currentAsset,
			[name]: value,
		}));
	};

	const handleUpdate = async (event) => {
		event.preventDefault();

		try {
			setUpdating(true);
			setError('');

			const response = await fetch(`${ASSETS_API_URL}/${editingAsset.id}`, {
				method: 'PUT',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify({
					assetTag: editingAsset.assetTag,
					name: editingAsset.name,
					serialNumber: editingAsset.serialNumber,
					status: editingAsset.status,
					purchaseDate: editingAsset.purchaseDate || null,
					purchaseCost: editingAsset.purchaseCost
						? Number(editingAsset.purchaseCost)
						: null,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || 'Could not update asset.');
			}

			setEditingAsset(null);
			await refreshAllData();
		} catch (error) {
			setError(error.message);
		} finally {
			setUpdating(false);
		}
	};

	const openAssignModal = (asset) => {
		if (employees.length === 0) {
			setError('Please add at least one employee before assigning an asset.');
			return;
		}

		setError('');
		setAssigningAsset(asset);
		setAssignmentForm({
			assetId: String(asset.id),
			employeeId: '',
			notes: '',
		});
	};

	const handleAssignmentSubmit = async (event) => {
		event.preventDefault();

		if (!assignmentForm.employeeId) {
			setError('Please select an employee.');
			return;
		}

		try {
			setSubmittingAssignment(true);
			setError('');

			const response = await fetch(ASSIGNMENTS_API_URL, {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify({
					assetId: Number(assignmentForm.assetId),
					employeeId: Number(assignmentForm.employeeId),
					notes: assignmentForm.notes || null,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || 'Could not assign asset.');
			}

			setAssigningAsset(null);
			setAssignmentForm(emptyAssignmentForm);
			await refreshAllData();
		} catch (error) {
			setError(error.message);
		} finally {
			setSubmittingAssignment(false);
		}
	};

	const filteredAssets = assets.filter((asset) => {
		const searchValue = searchTerm.toLowerCase().trim();

		const matchesSearch =
			asset.name?.toLowerCase().includes(searchValue) ||
			asset.asset_tag?.toLowerCase().includes(searchValue) ||
			asset.serial_number?.toLowerCase().includes(searchValue);

		const matchesStatus =
			statusFilter === 'all' || asset.status === statusFilter;

		return matchesSearch && matchesStatus;
	});

	const totalAssets = assets.length;
	const availableAssets = assets.filter((asset) => asset.status === 'available').length;
	const assignedAssets = assets.filter((asset) => asset.status === 'assigned').length;
	const maintenanceAssets = assets.filter(
		(asset) => asset.status === 'maintenance',
	).length;

	return (
		<div className="app-shell">
			<header className="topbar">
				<div>
					<p className="eyebrow">ASSET OPERATIONS</p>
					<h1>Smart Inventory</h1>
				</div>

				<button
					className="refresh-button"
					onClick={refreshAllData}
					type="button"
				>
					Refresh data
				</button>
			</header>

			<main className="dashboard">
				{error && <div className="error-message">{error}</div>}

				<section className="stats-grid">
					<article className="stat-card">
						<span>Total assets</span>
						<strong>{totalAssets}</strong>
					</article>
					<article className="stat-card">
						<span>Available</span>
						<strong>{availableAssets}</strong>
					</article>
					<article className="stat-card">
						<span>Assigned</span>
						<strong>{assignedAssets}</strong>
					</article>
					<article className="stat-card">
						<span>Maintenance</span>
						<strong>{maintenanceAssets}</strong>
					</article>
					<article className="stat-card">
						<span>Employees</span>
						<strong>{employees.length}</strong>
					</article>
				</section>

				<section className="content-grid">
					<div className="panel">
						<div className="panel-heading">
							<div>
								<p className="eyebrow">REGISTER</p>
								<h2>Add new asset</h2>
							</div>
						</div>

						<form className="asset-form" onSubmit={handleAssetSubmit}>
							<label>
								Asset tag *
								<input
									name="assetTag"
									onChange={handleAssetChange}
									placeholder="e.g. LAP-002"
									required
									value={assetForm.assetTag}
								/>
							</label>

							<label>
								Asset name *
								<input
									name="name"
									onChange={handleAssetChange}
									placeholder="e.g. HP EliteBook"
									required
									value={assetForm.name}
								/>
							</label>

							<label>
								Serial number
								<input
									name="serialNumber"
									onChange={handleAssetChange}
									placeholder="e.g. SN-12345"
									value={assetForm.serialNumber}
								/>
							</label>

							<label>
								Status
								<select
									name="status"
									onChange={handleAssetChange}
									value={assetForm.status}
								>
									<option value="available">Available</option>
									<option value="maintenance">Maintenance</option>
									<option value="retired">Retired</option>
								</select>
							</label>

							<label>
								Purchase date
								<input
									name="purchaseDate"
									onChange={handleAssetChange}
									type="date"
									value={assetForm.purchaseDate}
								/>
							</label>

							<label>
								Purchase cost
								<input
									min="0"
									name="purchaseCost"
									onChange={handleAssetChange}
									placeholder="e.g. 1200"
									step="0.01"
									type="number"
									value={assetForm.purchaseCost}
								/>
							</label>

							<button
								className="primary-button"
								disabled={submittingAsset}
								type="submit"
							>
								{submittingAsset ? 'Saving asset...' : 'Add asset'}
							</button>
						</form>
					</div>

					<div className="panel assets-panel">
						<div className="panel-heading">
							<div>
								<p className="eyebrow">INVENTORY</p>
								<h2>All assets</h2>
							</div>
							<span className="asset-count">{filteredAssets.length} records</span>
						</div>

						{loading ? (
							<p className="empty-state">Loading assets...</p>
						) : assets.length === 0 ? (
							<p className="empty-state">
								No assets found. Add your first asset from the form.
							</p>
						) : (
							<div className="table-wrapper">
								<div className="asset-filters">
									<input
										className="search-input"
										onChange={(event) => setSearchTerm(event.target.value)}
										placeholder="Search by asset name, tag, or serial..."
										type="search"
										value={searchTerm}
									/>

									<select
										className="status-filter"
										onChange={(event) => setStatusFilter(event.target.value)}
										value={statusFilter}
									>
										<option value="all">All statuses</option>
										<option value="available">Available</option>
										<option value="assigned">Assigned</option>
										<option value="maintenance">Maintenance</option>
										<option value="retired">Retired</option>
									</select>
								</div>

								{filteredAssets.length === 0 ? (
									<p className="empty-state">
										No assets match your search or selected status.
									</p>
								) : (
									<table>
										<thead>
											<tr>
												<th>Asset</th>
												<th>Serial</th>
												<th>Status</th>
												<th>Cost</th>
												<th>Action</th>
											</tr>
										</thead>
										<tbody>
											{filteredAssets.map((asset) => (
												<tr key={asset.id}>
													<td>
														<strong>{asset.name}</strong>
														<span>{asset.asset_tag}</span>
													</td>
													<td>{asset.serial_number || '—'}</td>
													<td>
														<span className={`status-badge ${asset.status}`}>
															{asset.status}
														</span>
													</td>
													<td>
														{asset.purchase_cost
															? `$${Number(asset.purchase_cost).toLocaleString()}`
															: '—'}
													</td>
													<td>
														<div className="action-buttons">
															{asset.status === 'available' && (
																<button
																	className="assign-button"
																	onClick={() => openAssignModal(asset)}
																	type="button"
																>
																	Assign
																</button>
															)}

															<button
																className="edit-button"
																onClick={() => startEdit(asset)}
																type="button"
															>
																Edit
															</button>

															<button
																className="delete-button"
																onClick={() =>
																	handleDeleteAsset(asset.id, asset.name)
																}
																type="button"
															>
																Delete
															</button>
														</div>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								)}
							</div>
						)}
					</div>
				</section>

				<section className="content-grid employees-section" id="employee-section">
					<div className="panel">
						<div className="panel-heading">
							<div>
								<p className="eyebrow">TEAM</p>
								<h2>
									{editingEmployeeId
										? 'Edit employee'
										: 'Add new employee'}
								</h2>
							</div>
						</div>

						<form className="asset-form" onSubmit={handleEmployeeSubmit}>
							<label>
								Employee name *
								<input
									name="name"
									onChange={handleEmployeeChange}
									placeholder="e.g. Ali Khan"
									required
									value={employeeForm.name}
								/>
							</label>

							<label>
								Email *
								<input
									name="email"
									onChange={handleEmployeeChange}
									placeholder="e.g. ali@company.com"
									required
									type="email"
									value={employeeForm.email}
								/>
							</label>

							<label>
								Department
								<input
									name="department"
									onChange={handleEmployeeChange}
									placeholder="e.g. IT"
									value={employeeForm.department}
								/>
							</label>

							<label>
								Designation
								<input
									name="designation"
									onChange={handleEmployeeChange}
									placeholder="e.g. IT Support Engineer"
									value={employeeForm.designation}
								/>
							</label>

							<div className="form-button-row">
								<button
									className="primary-button"
									disabled={submittingEmployee}
									type="submit"
								>
									{submittingEmployee
										? 'Saving...'
										: editingEmployeeId
											? 'Update employee'
											: 'Add employee'}
								</button>

								{editingEmployeeId && (
									<button
										className="secondary-button"
										onClick={cancelEmployeeEdit}
										type="button"
									>
										Cancel
									</button>
								)}
							</div>
						</form>
					</div>

					<div className="panel assets-panel">
						<div className="panel-heading">
							<div>
								<p className="eyebrow">EMPLOYEES</p>
								<h2>All employees</h2>
							</div>
							<span className="asset-count">{employees.length} records</span>
						</div>

						{employeeLoading ? (
							<p className="empty-state">Loading employees...</p>
						) : employees.length === 0 ? (
							<p className="empty-state">
								No employees found. Add your first employee from the form.
							</p>
						) : (
							<div className="table-wrapper">
								<table>
									<thead>
										<tr>
											<th>Employee</th>
											<th>Email</th>
											<th>Department</th>
											<th>Designation</th>
											<th>Action</th>
										</tr>
									</thead>
									<tbody>
										{employees.map((employee) => (
											<tr key={employee.id}>
												<td>
													<strong>{employee.name}</strong>
												</td>
												<td>{employee.email}</td>
												<td>{employee.department || '—'}</td>
												<td>{employee.designation || '—'}</td>
												<td>
													<div className="action-buttons">
														<button
															className="edit-button"
															onClick={() => handleEditEmployee(employee)}
															type="button"
														>
															Edit
														</button>

														<button
															className="delete-button"
															onClick={() =>
																handleDeleteEmployee(
																	employee.id,
																	employee.name,
																)
															}
															type="button"
														>
															Delete
														</button>
													</div>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</div>
				</section>

				<section className="panel assignments-panel">
					<div className="panel-heading">
						<div>
							<p className="eyebrow">ASSET ASSIGNMENTS</p>
							<h2>Current assignments</h2>
						</div>
						<span className="asset-count">{assignments.length} records</span>
					</div>

					{assignmentLoading ? (
						<p className="empty-state">Loading assignments...</p>
					) : assignments.length === 0 ? (
						<p className="empty-state">
							No active asset assignments found.
						</p>
					) : (
						<div className="table-wrapper">
							<table>
								<thead>
									<tr>
										<th>Asset</th>
										<th>Assigned to</th>
										<th>Department</th>
										<th>Assigned date</th>
										<th>Action</th>
									</tr>
								</thead>
								<tbody>
									{assignments.map((assignment) => (
										<tr key={assignment.id}>
											<td>
												<strong>{assignment.asset_name}</strong>
												<span>{assignment.asset_tag}</span>
											</td>
											<td>{assignment.employee_name}</td>
											<td>{assignment.department || '—'}</td>
											<td>
												{assignment.assigned_at
													? new Date(
														assignment.assigned_at,
													).toLocaleDateString()
													: '—'}
											</td>
											<td>
												<button
													className="return-button"
													onClick={() => handleReturnAsset(assignment)}
													type="button"
												>
													Return
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</section>

				<section className="panel assignments-panel history-panel">
					<div className="panel-heading">
						<div>
							<p className="eyebrow">ASSIGNMENT HISTORY</p>
							<h2>Assignment history</h2>
						</div>
						<span className="asset-count">
							{assignmentHistory.length} records
						</span>
					</div>

					{historyLoading ? (
						<p className="empty-state">Loading assignment history...</p>
					) : assignmentHistory.length === 0 ? (
						<p className="empty-state">No assignment history found yet.</p>
					) : (
						<div className="table-wrapper">
							<table>
								<thead>
									<tr>
										<th>Asset</th>
										<th>Employee</th>
										<th>Assigned date</th>
										<th>Returned date</th>
										<th>Status</th>
									</tr>
								</thead>
								<tbody>
									{assignmentHistory.map((assignment) => (
										<tr key={assignment.id}>
											<td>
												<strong>{assignment.asset_name}</strong>
												<span>{assignment.asset_tag}</span>
											</td>
											<td>
												<strong>{assignment.employee_name}</strong>
												<span>{assignment.department || '—'}</span>
											</td>
											<td>
												{assignment.assigned_at
													? new Date(
														assignment.assigned_at,
													).toLocaleDateString()
													: '—'}
											</td>
											<td>
												{assignment.returned_at
													? new Date(
														assignment.returned_at,
													).toLocaleDateString()
													: 'Not returned yet'}
											</td>
											<td>
												<span
													className={`status-badge ${
														assignment.assignment_status === 'returned'
															? 'available'
															: 'assigned'
													}`}
												>
													{assignment.assignment_status === 'returned'
														? 'Returned'
														: 'Active'}
												</span>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</section>

				<section className="panel activity-panel">
					<div className="panel-heading">
						<div>
							<p className="eyebrow">AUDIT LOG</p>
							<h2>Recent activity</h2>
						</div>
						<span className="asset-count">{activities.length} records</span>
					</div>

					{activityLoading ? (
						<p className="empty-state">Loading recent activity...</p>
					) : activities.length === 0 ? (
						<p className="empty-state">No activity recorded yet.</p>
					) : (
						<div className="activity-list">
							{activities.map((activity) => {
								const details = activity.details || {};

								const actionLabels = {
									asset_created: 'Asset added',
									asset_assigned: 'Asset assigned',
									asset_returned: 'Asset returned',
									asset_deleted: 'Asset deleted',
									employee_created: 'Employee added',
									employee_deleted: 'Employee deleted',
								};

								const actionClass = activity.action?.replaceAll('_', '-');

								return (
									<div className="activity-item" key={activity.id}>
										<div className={`activity-icon ${actionClass}`}>
											{activity.action === 'asset_created' && '+'}
											{activity.action === 'asset_assigned' && '→'}
											{activity.action === 'asset_returned' && '↩'}
											{activity.action === 'asset_deleted' && '×'}
											{activity.action === 'employee_created' && '+'}
											{activity.action === 'employee_deleted' && '×'}
										</div>

										<div className="activity-content">
											<strong>
												{actionLabels[activity.action] || activity.action}
											</strong>
											<p>
												{details.message ||
													'Activity was recorded successfully.'}
											</p>
										</div>

										<time>
											{activity.created_at
												? new Date(activity.created_at).toLocaleString()
												: '—'}
										</time>
									</div>
								);
							})}
						</div>
					)}
				</section>

				{editingAsset && (
					<div className="modal-backdrop">
						<div className="edit-modal">
							<div className="modal-header">
								<div>
									<p className="eyebrow">UPDATE ASSET</p>
									<h2>Edit {editingAsset.name}</h2>
								</div>
								<button
									className="close-button"
									onClick={() => setEditingAsset(null)}
									type="button"
								>
									×
								</button>
							</div>

							<form className="asset-form" onSubmit={handleUpdate}>
								<label>
									Asset tag *
									<input
										name="assetTag"
										onChange={handleEditChange}
										required
										value={editingAsset.assetTag}
									/>
								</label>

								<label>
									Asset name *
									<input
										name="name"
										onChange={handleEditChange}
										required
										value={editingAsset.name}
									/>
								</label>

								<label>
									Serial number
									<input
										name="serialNumber"
										onChange={handleEditChange}
										value={editingAsset.serialNumber}
									/>
								</label>

								<label>
									Status
									<select
										name="status"
										onChange={handleEditChange}
										value={editingAsset.status}
									>
										<option value="available">Available</option>
										<option value="maintenance">Maintenance</option>
										<option value="assigned">Assigned</option>
										<option value="retired">Retired</option>
									</select>
								</label>

								<label>
									Purchase date
									<input
										name="purchaseDate"
										onChange={handleEditChange}
										type="date"
										value={editingAsset.purchaseDate}
									/>
								</label>

								<label>
									Purchase cost
									<input
										min="0"
										name="purchaseCost"
										onChange={handleEditChange}
										step="0.01"
										type="number"
										value={editingAsset.purchaseCost}
									/>
								</label>

								<div className="modal-actions">
									<button
										className="secondary-button"
										onClick={() => setEditingAsset(null)}
										type="button"
									>
										Cancel
									</button>
									<button
										className="primary-button"
										disabled={updating}
										type="submit"
									>
										{updating ? 'Updating...' : 'Save changes'}
									</button>
								</div>
							</form>
						</div>
					</div>
				)}

				{assigningAsset && (
					<div className="modal-backdrop">
						<div className="edit-modal">
							<div className="modal-header">
								<div>
									<p className="eyebrow">ASSIGN ASSET</p>
									<h2>{assigningAsset.name}</h2>
								</div>
								<button
									className="close-button"
									onClick={() => setAssigningAsset(null)}
									type="button"
								>
									×
								</button>
							</div>

							<form className="asset-form" onSubmit={handleAssignmentSubmit}>
								<label>
									Assign to employee *
									<select
										name="employeeId"
										onChange={handleAssignmentChange}
										required
										value={assignmentForm.employeeId}
									>
										<option value="">Select an employee</option>
										{employees.map((employee) => (
											<option key={employee.id} value={employee.id}>
												{employee.name} —{' '}
												{employee.department || 'No department'}
											</option>
										))}
									</select>
								</label>

								<label>
									Assignment notes
									<textarea
										name="notes"
										onChange={handleAssignmentChange}
										placeholder="e.g. Issued for office work"
										rows="4"
										value={assignmentForm.notes}
									/>
								</label>

								<div className="modal-actions">
									<button
										className="secondary-button"
										onClick={() => setAssigningAsset(null)}
										type="button"
									>
										Cancel
									</button>
									<button
										className="primary-button"
										disabled={submittingAssignment}
										type="submit"
									>
										{submittingAssignment
											? 'Assigning...'
											: 'Assign asset'}
									</button>
								</div>
							</form>
						</div>
					</div>
				)}
			</main>
		</div>
	);
}

export default App;