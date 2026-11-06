require('dotenv').config();
const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const config = require('./config.json');
const app = express();
const port = Number(process.env.PORT || 3000);
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'laboratorio',
  user: process.env.DB_USER || 'appuser',
  password: process.env.DB_PASSWORD || '',
  connectionTimeoutMillis: 5000
});
const fields = config.fields.map(f => f.name);
const names = fields.join(', ');
const columns = fields.map((f,i)=>`$${i+1}`).join(', ');
const setList = fields.map((f,i)=>`${f}=$${i+1}`).join(', ');
const table = config.table;

app.use(express.json({limit:'32kb'}));
app.use(express.static(path.join(__dirname,'public')));
app.get('/api/config', (_req,res)=>res.json({title:config.title,subtitle:config.subtitle,icon:config.icon,fields:config.fields,table:config.table,color:config.color}));
app.get('/api/health', async (_req,res)=>{
  try { await pool.query('SELECT 1'); res.json({status:'ok',database:'conectado'}); }
  catch (err) { res.status(503).json({status:'erro',database:'indisponivel'}); }
});
function validate(body) {
  const values=[];
  for (const f of config.fields) {
    let value = body[f.name];
    if (value===undefined || value===null || String(value).trim()==='') return {error:`Campo obrigatório: ${f.label}`};
    if (f.type==='integer') {
      value=Number(value);
      if(!Number.isSafeInteger(value)) return {error:`Valor inteiro inválido: ${f.label}`};
    } else if (f.type==='decimal') {
      value=Number(value);
      if(!Number.isFinite(value)) return {error:`Número inválido: ${f.label}`};
    } else {
      value=String(value).trim();
      if(value.length>180) return {error:`Texto muito longo: ${f.label}`};
      if(f.type==='email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return {error:'E-mail inválido'};
      if(f.type==='date' && !/^\d{4}-\d{2}-\d{2}$/.test(value)) return {error:'Data inválida'};
      if(f.type.startsWith('select:') && !f.type.slice(7).split('|').includes(value)) return {error:`Opção inválida: ${f.label}`};
    }
    if((f.name==='quantidade'||f.name==='preco') && value<0) return {error:`${f.label} não pode ser negativo`};
    if(f.name==='ano'&&(value<1450||value>2100)) return {error:'Ano fora do intervalo permitido'};
    values.push(value);
  }
  return {values};
}
function errorResponse(err,res){
  console.error('Erro no banco:',err.message);
  const badData=err.code==='23514'||err.code==='23502'||err.code==='22007'||err.code==='22008'||err.code==='22001';
  return res.status(badData?400:500).json({error:badData?'Dados inválidos para o banco':'Falha na operação. Verifique o PostgreSQL e os logs.'});
}
app.get('/api/itens', async (_req,res)=>{
  try { const result=await pool.query(`SELECT * FROM ${table} ORDER BY id DESC`); res.json(result.rows); }
  catch(err){errorResponse(err,res);}
});
app.post('/api/itens', async (req,res)=>{
  const v=validate(req.body); if(v.error) return res.status(400).json({error:v.error});
  try { const result=await pool.query(`INSERT INTO ${table} (${names}) VALUES (${columns}) RETURNING *`,v.values); res.status(201).json(result.rows[0]); }
  catch(err){errorResponse(err,res);}
});
app.put('/api/itens/:id', async (req,res)=>{
  const id=Number(req.params.id);
  if(!Number.isSafeInteger(id)||id<1) return res.status(400).json({error:'ID inválido'});
  const v=validate(req.body); if(v.error) return res.status(400).json({error:v.error});
  try { const result=await pool.query(`UPDATE ${table} SET ${setList} WHERE id=$${fields.length+1} RETURNING *`,[...v.values,id]);
    if(!result.rowCount) return res.status(404).json({error:'Registro não encontrado'});
    res.json(result.rows[0]); }
  catch(err){errorResponse(err,res);}
});
app.delete('/api/itens/:id', async (req,res)=>{
  const id=Number(req.params.id);
  if(!Number.isSafeInteger(id)||id<1) return res.status(400).json({error:'ID inválido'});
  try { const result=await pool.query(`DELETE FROM ${table} WHERE id=$1 RETURNING id`,[id]);
    if(!result.rowCount) return res.status(404).json({error:'Registro não encontrado'});
    res.status(204).end(); }
  catch(err){errorResponse(err,res);}
});
app.listen(port,'0.0.0.0',()=>console.log(`${config.title}: http://localhost:${port}`));
process.on('SIGTERM',()=>pool.end().finally(()=>process.exit(0)));
