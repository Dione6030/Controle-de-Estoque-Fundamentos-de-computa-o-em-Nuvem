-- Este script é executado apenas ao inicializar um diretório de dados PostgreSQL vazio.
CREATE TABLE IF NOT EXISTS produtos (id SERIAL PRIMARY KEY, nome VARCHAR(120) NOT NULL, categoria VARCHAR(100) NOT NULL, quantidade INTEGER NOT NULL CHECK (quantidade >= 0), preco NUMERIC(12,2) NOT NULL CHECK (preco >= 0), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
INSERT INTO produtos (nome,categoria,quantidade,preco) VALUES ('Mouse USB','Periféricos',15,49.90),('Teclado ABNT2','Periféricos',8,89.50),('Cabo HDMI','Cabos',30,19.90);
