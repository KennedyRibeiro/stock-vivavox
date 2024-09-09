const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());
const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

const { Pool } = require('pg');
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'sistema_estoque',
    password: 'suporte123',
    port: 5432,
});

app.get('/', (req, res) => {
    res.send('Servidor está funcionando!');
});

// Middleware de autenticação básica
const authenticateBasic = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const auth = authHeader && authHeader.split(' ')[1];
    
    if (!auth) return res.sendStatus(401); // Se não há autenticação, não autorizado
    
    const [username, password] = Buffer.from(auth, 'base64').toString().split(':');
    
    if (!username || !password) return res.sendStatus(401); // Se não há usuário ou senha, não autorizado

    try {
        const result = await pool.query('SELECT * FROM admin WHERE username = $1', [username]);
        const user = result.rows[0];

        if (user && user.password === password) {
            req.user = user;
            next(); // Usuário autenticado, prosseguir para a rota
        } else {
            res.sendStatus(401); // Credenciais inválidas
        }
    } catch (error) {
        console.error('Erro ao autenticar usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

// Rotas
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM admin WHERE username = $1', [username]);
        const user = result.rows[0];

        if (user && user.password === password) {
            res.json({ success: true, message: 'Login bem-sucedido!' });
        } else {
            res.status(401).json({ success: false, message: 'Credenciais inválidas' });
        }
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

app.post('/addEquipment', authenticateBasic, async (req, res) => {
    const { type, condition, quantity } = req.body;

    const produtoExistente = await pool.query(
        'SELECT * FROM produtos WHERE tipo = $1 AND condicao = $2',
        [type, condition]
    );

    if (produtoExistente.rows.length > 0) {
        await pool.query(
            'UPDATE produtos SET quantidade = quantidade + $1 WHERE id = $2',
            [quantity, produtoExistente.rows[0].id]
        );
    } else {
        await pool.query(
            'INSERT INTO produtos (tipo, condicao, quantidade) VALUES ($1, $2, $3)',
            [type, condition, quantity]
        );
    }

    res.json({ success: true, message: 'Equipamento adicionado com sucesso!' });
});

app.post('/removeEquipment', authenticateBasic, async (req, res) => {
    const { type, condition, quantity } = req.body;

    const produtoExistente = await pool.query(
        'SELECT * FROM produtos WHERE tipo = $1 AND condicao = $2',
        [type, condition]
    );

    if (produtoExistente.rows.length > 0) {
        const novaQuantidade = produtoExistente.rows[0].quantidade - quantity;
        if (novaQuantidade >= 0) {
            await pool.query(
                'UPDATE produtos SET quantidade = $1 WHERE id = $2',
                [novaQuantidade, produtoExistente.rows[0].id]
            );
            res.json({ success: true, message: 'Equipamento removido com sucesso!' });
        } else {
            res.status(400).json({ success: false, message: 'Quantidade insuficiente em estoque.' });
        }
    } else {
        res.status(404).json({ success: false, message: 'Equipamento não encontrado.' });
    }
});

app.get('/inventory', authenticateBasic, async (req, res) => {
    const result = await pool.query(`
        SELECT 
            e.tipo AS equipment, 
            COALESCE(SUM(CASE WHEN p.condicao = 'nova' THEN p.quantidade ELSE 0 END), 0) AS new, 
            COALESCE(SUM(CASE WHEN p.condicao = 'semi-novo' THEN p.quantidade ELSE 0 END), 0) AS semiNew, 
            COALESCE(SUM(p.quantidade), 0) AS total
        FROM 
            (SELECT DISTINCT tipo FROM produtos) e 
        LEFT JOIN 
            produtos p 
        ON 
            e.tipo = p.tipo
        GROUP BY 
            e.tipo
    `);
    res.json(result.rows);
});

// Redirecionar todas as outras rotas para o login.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/login.html'));
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});