const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

// Middleware para permitir CORS
app.use(cors());
app.use(express.json()); // Para que o Express possa ler os corpos das requisições JSON
app.use(cors());

//Conexção com o MongoDb
const MONGO_URI = 'mongodb+srv://nluca88:colorado@nic.c1hus.mongodb.net/lanchonete?retryWrites=true&w=majority&appName=nic';

mongoose.connect(MONGO_URI)
  .then(() => console.log('Conectado ao MongoDB'))
  .catch(err => console.error('Erro ao conectar ao MongoDB', err));

// Modelo para estoque
const Estoque = mongoose.model('estoque', new mongoose.Schema({
  nome: String,
  quantidade: Number,
  preco: Number,
  quantidade_padrao: Number, // Novo atributo
}));

// Modelo para pedidos
const Pedido = mongoose.model('pedidos', new mongoose.Schema({
  nome: String,
  ingredientes: [{
    nome: String,
    quantidade: Number
  }],
  valor_total: Number,
  valor_gasto: Number, // Adicionado
  data: { type: Date, default: Date.now },
  status: String
}));

// Modelo para histórico
const Historico = mongoose.model('historico', new mongoose.Schema({
  nome: String,
  ingredientes: [{ nome: String, quantidade: Number }],
  valor_total: Number,
  dataEscolha: Date,
  status: String,
  valor_gasto: Number,
}));
// PEDIDOS
// Rota para obter todos os pedidos
app.get('/api/pedidos', async (req, res) => {
    try {
      console.log('Recebida requisição para listar pedidos');
      const pedidos = await Pedido.find();
      console.log('Pedidos encontrados:', pedidos);
      res.json(pedidos);
    } catch (err) {
      console.error('Erro ao buscar pedidos:', err);
      res.status(500).json({ message: 'Erro ao buscar pedidos', error: err });
    }
  });

  // Adicionar um pedido
app.post('/api/pedidoAdd', async (req, res) => {
  const { nome, ingredientes, valor_total } = req.body;

  try {
    const novoPedido = new Pedido({
      nome,
      ingredientes,
      valor_total,
      status: 'Pendente', // Status inicial padrão
    });

    const pedidoSalvo = await novoPedido.save();
    res.status(201).json(pedidoSalvo);
  } catch (error) {
    console.error('Erro ao adicionar pedido:', error);
    res.status(400).json({ message: 'Erro ao adicionar pedido', error });
  }
});


//ESTOQUE/INGREDIENTES
// Obter lista de ingredientes (GET /api/estoque)
app.get('/api/estoque', async (req, res) => {
    try {
      const ingredientes = await Estoque.find();
      res.json(ingredientes);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao buscar ingredientes', error });
    }
  });

// Adicionar um ingrediente
app.post('/api/estoqueAdd', async (req, res) => {
  const { nome, quantidade, preco, quantidade_padrao } = req.body; // Incluído quantidade_padrao

  try {
    const novoIngrediente = new Estoque({ nome, quantidade, preco, quantidade_padrao }); // Incluído quantidade_padrao
    const ingredienteSalvo = await novoIngrediente.save();
    res.status(201).json(ingredienteSalvo);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao adicionar ingrediente', error });
  }
});

// Atualizar um ingrediente
app.put('/api/estoque/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, quantidade, preco, quantidade_padrao } = req.body; // Incluído quantidade_padrao

  try {
    const ingredienteAtualizado = await Estoque.findByIdAndUpdate(
      id,
      { nome, quantidade, preco, quantidade_padrao }, // Incluído quantidade_padrao
      { new: true, runValidators: true }
    );

    if (!ingredienteAtualizado) {
      return res.status(404).json({ message: 'Ingrediente não encontrado' });
    }

    res.json(ingredienteAtualizado);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao atualizar ingrediente', error });
  }
});

// Deletar um ingrediente pelo ID
app.delete('/api/estoque/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const ingredienteDeletado = await Estoque.findByIdAndDelete(id);

    if (!ingredienteDeletado) {
      return res.status(404).json({ message: 'Ingrediente não encontrado' });
    }

    res.json({ message: 'Ingrediente deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar ingrediente:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

//HISTÓRICO
// Adicionar pedido ao histórico
app.post('/api/historicoAdd', async (req, res) => {
  try {
    const { nome, ingredientes, valor_total, status, dataEscolha, valor_gasto } = req.body;

    const historico = new Historico({
      nome,
      ingredientes,
      valor_total,
      status: status || 'Em andamento', // Status padrão
      dataEscolha: new Date(), // Certifica-se de que `dataEscolha` seja preenchido
      valor_gasto: valor_gasto || 0, // Valor gasto padrão
    });

    const historicoSalvo = await historico.save();
    res.status(201).json(historicoSalvo);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao adicionar histórico', error });
  }
});

// Atualizar pedido no histórico
app.put('/api/historico/:id', async (req, res) => {
  const { id } = req.params;
  const { status, valor_gasto } = req.body;

  try {
    // Verifica se os dados necessários estão presentes
    if (!status) {
      return res.status(400).json({ message: "O campo 'status' é obrigatório." });
    }

    if (status === "Concluído" && (valor_gasto === undefined || valor_gasto < 0)) {
      return res.status(400).json({ message: "O campo 'valor_gasto' é obrigatório e deve ser válido." });
    }

    // Atualiza o pedido no banco
    const pedidoAtualizado = await Historico.findByIdAndUpdate(
      id,
      { status, valor_gasto },
      { new: true }
    );

    if (!pedidoAtualizado) {
      return res.status(404).json({ message: "Pedido não encontrado." });
    }

    res.json(pedidoAtualizado);
  } catch (error) {
    console.error("Erro ao atualizar o histórico:", error);
    res.status(500).json({ message: "Erro ao atualizar o pedido.", error });
  }
});

// Listar histórico (últimos 7 dias)
app.get('/api/historico', async (req, res) => {
  const { ultimoSeteDias } = req.query;

  try {
    let filtro = {};
    if (ultimoSeteDias === 'true') {
      const seteDiasAtras = new Date();
      seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
      filtro = { dataEscolha: { $gte: seteDiasAtras } }; // Certifique-se de usar dataEscolha
    }

    const historico = await Historico.find(filtro);
    res.json(historico);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar histórico', error });
  }
});

// Rota POST para deduzir ingredientes
app.post('/api/estoque/deduzir-ingrediente', async (req, res) => {
  const { nome, quantidade } = req.body;
  try {
    const ingrediente = await Estoque.findOne({
      nome: { $regex: new RegExp(`^${nome}$`, 'i') } // Busca case-insensitive
    });

    if (!ingrediente) {
      return res.status(404).json({ message: 'Ingrediente não encontrado' });
    }

    if (ingrediente.quantidade < quantidade) {
      return res.status(400).json({ message: 'Estoque insuficiente' });
    }

    ingrediente.quantidade -= quantidade;
    await ingrediente.save();
    res.json(ingrediente);
  } catch (error) {
    console.error("Erro ao deduzir estoque:", error);
    res.status(500).json({ message: 'Erro ao deduzir estoque', error });
  }
});

// Rota dinâmica para atualizar ingredientes
app.put('/api/estoque/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, quantidade, preco, quantidade_padrao } = req.body;

  try {
    const ingredienteAtualizado = await Estoque.findByIdAndUpdate(
      id,
      { nome, quantidade, preco, quantidade_padrao },
      { new: true, runValidators: true }
    );

    if (!ingredienteAtualizado) {
      return res.status(404).json({ message: 'Ingrediente não encontrado' });
    }

    res.json(ingredienteAtualizado);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao atualizar ingrediente', error });
  }
});

app.get('/api/estoque/nome/:nome', async (req, res) => {
  try {
    const nomeIngrediente = req.params.nome;
    const ingredientes = await Estoque.find({
      nome: { $regex: new RegExp(`^${nomeIngrediente}$`, 'i') } // Case-insensitive regex
    });
    res.json(ingredientes);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar ingrediente por nome', error });
  }
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Backend rodando na porta ${port}`);
});