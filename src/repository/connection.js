import mysql from 'mysql2/promise'

const con = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  database: 'rop',
  password: 'root'
})

console.log('Conectou com MYSQL!');

export { con };
  