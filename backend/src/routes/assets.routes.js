import {Router} from 'express';
import {pool} from '../config/database.js';
import {createActivity} from '../utils/activity.js';

export const assetsRouter = Router();

assetsRouter.get('/', async (request, response, next) => {
	try {
		const result = await pool.query(`
			SELECT
				assets.id,
				assets.asset_tag,
				assets.name,
				assets.serial_number,
				assets.status,
				assets.purchase_date,
				assets.purchase_cost,
				categories.name AS category_name
			FROM assets
			LEFT JOIN categories ON categories.id = assets.category_id
			ORDER BY assets.id DESC
		`);

		response.json({
			success: true,
			count: result.rows.length,
			assets: result.rows,
		});
	} catch (error) {
		next(error);
	}
});

assetsRouter.post('/', async (request, response, next) => {
	try {
		const {
			assetTag,
			name,
			serialNumber,
			status = 'available',
			categoryId = null,
			purchaseDate = null,
			purchaseCost = null,
		} = request.body;

		if (!assetTag || !name) {
			return response.status(400).json({
				success: false,
				message: 'Asset tag and asset name are required.',
			});
		}

		const result = await pool.query(
			`INSERT INTO assets (
				asset_tag,
				name,
				serial_number,
				status,
				category_id,
				purchase_date,
				purchase_cost
			)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
			RETURNING *`,
			[
				assetTag,
				name,
				serialNumber,
				status,
				categoryId,
				purchaseDate,
				purchaseCost,
			],
		);

		const asset = result.rows[0];

		await createActivity({
			action: 'asset_created',
			entityType: 'asset',
			entityId: asset.id,
			details: {
				message: `New asset "${asset.name}" (${asset.asset_tag}) was added.`,
				assetTag: asset.asset_tag,
				assetName: asset.name,
				status: asset.status,
			},
		});

		response.status(201).json({
			success: true,
			message: 'Asset added successfully.',
			asset,
		});
	} catch (error) {
		next(error);
	}
});

assetsRouter.get('/:id', async (request, response, next) => {
	try {
		const assetId = Number(request.params.id);

		if (!Number.isInteger(assetId) || assetId < 1) {
			return response.status(400).json({
				success: false,
				message: 'Please provide a valid asset ID.',
			});
		}

		const result = await pool.query(
			`SELECT
				assets.id,
				assets.asset_tag,
				assets.name,
				assets.serial_number,
				assets.status,
				assets.purchase_date,
				assets.purchase_cost,
				categories.name AS category_name
			FROM assets
			LEFT JOIN categories ON categories.id = assets.category_id
			WHERE assets.id = $1`,
			[assetId],
		);

		const asset = result.rows[0];

		if (!asset) {
			return response.status(404).json({
				success: false,
				message: 'Asset not found.',
			});
		}

		response.json({
			success: true,
			asset,
		});
	} catch (error) {
		next(error);
	}
});

assetsRouter.put('/:id', async (request, response, next) => {
	try {
		const assetId = Number(request.params.id);

		if (!Number.isInteger(assetId) || assetId < 1) {
			return response.status(400).json({
				success: false,
				message: 'Please provide a valid asset ID.',
			});
		}

		const {
			assetTag,
			name,
			serialNumber,
			status,
			categoryId,
			purchaseDate,
			purchaseCost,
		} = request.body;

		const result = await pool.query(
			`UPDATE assets
			SET
				asset_tag = COALESCE($1, asset_tag),
				name = COALESCE($2, name),
				serial_number = COALESCE($3, serial_number),
				status = COALESCE($4, status),
				category_id = COALESCE($5, category_id),
				purchase_date = COALESCE($6, purchase_date),
				purchase_cost = COALESCE($7, purchase_cost),
				updated_at = CURRENT_TIMESTAMP
			WHERE id = $8
			RETURNING *`,
			[
				assetTag,
				name,
				serialNumber,
				status,
				categoryId,
				purchaseDate,
				purchaseCost,
				assetId,
			],
		);

		const asset = result.rows[0];

		if (!asset) {
			return response.status(404).json({
				success: false,
				message: 'Asset not found.',
			});
		}

		await createActivity({
			action: 'asset_updated',
			entityType: 'asset',
			entityId: asset.id,
			details: {
				message: `Asset "${asset.name}" (${asset.asset_tag}) was updated.`,
				assetTag: asset.asset_tag,
				assetName: asset.name,
				status: asset.status,
			},
		});

		response.json({
			success: true,
			message: 'Asset updated successfully.',
			asset,
		});
	} catch (error) {
		next(error);
	}
});

assetsRouter.delete('/:id', async (request, response, next) => {
	try {
		const assetId = Number(request.params.id);

		if (!Number.isInteger(assetId) || assetId < 1) {
			return response.status(400).json({
				success: false,
				message: 'Please provide a valid asset ID.',
			});
		}

		const result = await pool.query(
			`DELETE FROM assets
			WHERE id = $1
			RETURNING id, asset_tag, name`,
			[assetId],
		);

		const asset = result.rows[0];

		if (!asset) {
			return response.status(404).json({
				success: false,
				message: 'Asset not found.',
			});
		}

		await createActivity({
			action: 'asset_deleted',
			entityType: 'asset',
			entityId: asset.id,
			details: {
				message: `Asset "${asset.name}" (${asset.asset_tag}) was deleted.`,
				assetTag: asset.asset_tag,
				assetName: asset.name,
			},
		});

		response.json({
			success: true,
			message: 'Asset deleted successfully.',
			asset,
		});
	} catch (error) {
		next(error);
	}
});