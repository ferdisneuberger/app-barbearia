# Projeto Barbearia

Base inicial do sistema com:

- backend HTTP em Node.js + TypeScript
- frontend em Vite React
- MongoDB com persistencia via mongoose
- regras principais de agendamento, disponibilidade e pagamento
- Docker para subir API e Web

## Comandos

### API

```bash
npm run dev:api
```

String de conexao local do Mongo:

```bash
mongodb://localhost:27017/barbearia
```

### Frontend

```bash
npm install
npm run dev:web
```

### Testes da API

```bash
npm run test:api
```

### Docker Compose

```bash
docker compose up --build
```

### Acesso Pelo Celular

Defina o IP local da sua maquina antes de subir os containers:

```bash
export HOST_IP=192.168.0.147
docker compose up --build
```

Depois abra no celular:

```text
http://192.168.0.147:5173
```

Para descobrir o IP da sua maquina:

```bash
hostname -I
```
