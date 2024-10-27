const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

dotenv.config();

console.log('MongoDB URI:', process.env.MONGODB_URI);
console.log('MARIADB Host:', process.env.MARIADB_HOST);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');

    const server = http.createServer(app);
    const io = new Server(server);

    io.on('connection', (socket) => {
        console.log('Usuario conectado');
        socket.on('disconnect', () => {
            console.log('Usuario desconectado');
        });
    });

    app.get('/', (req, res) => {
        res.send('¡API funcionando correctamente!');
    });

    const itemSchema = new mongoose.Schema({
        name: String,
        description: String,
    });

    const Item = mongoose.model('Item', itemSchema);

    app.get('/items', async (req, res) => {
        try {
            const items = await Item.find();
            res.json(items);
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener items', error });
        }
    });

    app.post('/login', async (req, res) => {
        const { username, password } = req.body;
        const user = { id: 1, username };
        const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    });

    app.get('/protected', (req, res) => {
        const token = req.headers['authorization'];

        if (!token) return res.sendStatus(403);

        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) return res.sendStatus(403);
            res.json({ message: 'Acceso permitido', user });
        });
    });

    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });
