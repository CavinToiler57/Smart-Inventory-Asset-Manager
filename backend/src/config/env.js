import 'dotenv/config';

export const env = {
	port: Number(process.env.PORT) || 5000,
	databaseUrl: process.env.DATABASE_URL,
	jwtSecret: process.env.JWT_SECRET,
	emailUser: process.env.EMAIL_USER,
	emailPassword: process.env.EMAIL_PASSWORD,
	adminEmail: process.env.ADMIN_EMAIL,
};