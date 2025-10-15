const express = require('express');
const sql = require('mssql');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const dbConfig = {
  server: 'localhost\\SQLEXPRESS',
  database: 'ClientServiceDB',
  user: 'sa',
  password: 'sua_senha',
  options: {
    enableArithAbort: true,
    trustServerCertificate: true
  }
};

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/sync', async (req, res) => {
  try {
    const { since } = req.query;
    
    await sql.connect(dbConfig);
    
    let clientsQuery = `SELECT * FROM clientes`;
    if (since) {
      clientsQuery += ` WHERE extraction_date > '${since}'`;
    }
    
    const clientsResult = await sql.query(clientsQuery);
    
    let servicesQuery = `SELECT * FROM servicos`;
    if (since) {
      servicesQuery += ` WHERE extraction_date > '${since}'`;
    }
    
    const servicesResult = await sql.query(servicesQuery);
    
    res.json({
      clients: clientsResult.recordset,
      services: servicesResult.recordset,
      sync_date: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Erro na sincronização:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor API rodando na porta ${port}`);
});