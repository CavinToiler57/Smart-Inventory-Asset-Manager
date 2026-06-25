import nodemailer from 'nodemailer';
import {env} from '../config/env.js';

const transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: env.emailUser,
		pass: env.emailPassword,
	},
});

export const sendEmail = async ({to, subject, html}) => {
	if (!env.emailUser || !env.emailPassword) {
		throw new Error(
			'Email is not configured. Add EMAIL_USER and EMAIL_PASSWORD in backend/.env.',
		);
	}

	const result = await transporter.sendMail({
		from: `"Smart Inventory System" <${env.emailUser}>`,
		to,
		subject,
		html,
	});

	return result;
};