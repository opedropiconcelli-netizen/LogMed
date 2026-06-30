CREATE table alas(
  id SERIAL PRIMARY key,
  nome VARCHAR(100) NOT NULL,
  capacidade_leitos INT,
  andar VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE table insumos(
  id SERIAL PRIMARY key,
  nome VARCHAR(150) NOT NULL,
  quantidade_estoque INT DEFAULT 0,
  ala_id INT
    REFERENCES alas(id)
    ON DELETE SET NULL,
  data_validade DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO alas(nome, capacidade_leitos, andar)
  VALUES
    ('UTI Adulto', 20, '3º Andar'),
    ('Pediatria', 35, '1º Andar'),
    ('Emergência', 50, 'Térreo'),
    ('Centro Cirúrgico', 10, '2º Andar');

INSERT INTO insumos (nome, quantidade_estoque, ala_id, data_validade)
  VALUES 
    ('Seringa 10ml', 1500, 3, '2027-12-31'),
    ('Soro Fisiológico 500ml', 800, 1, '2026-10-15'),
    ('Luvas Cirúrgicas (Caixa)', 300, 4, '2028-05-20'),
    ('Fralda Infantil (Pacote)', 450, 2, '2027-01-10'),
    ('Dipirona Injetável', 120, 3, '2026-08-30'),
    ('Cateter Venoso', 250, 1, '2027-04-12');

SELECT 
    i.nome AS insumo,                
    i.quantidade_estoque,             
    a.nome AS ala_hospitalar           
FROM 
    insumos i
JOIN 
    alas a 
    ON i.ala_id = a.id;
