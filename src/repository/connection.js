
import mysql from 'mysql2/promise';

const con = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD ?? 'root',
    database: process.env.DB_NAME || 'rop',

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export { con };
