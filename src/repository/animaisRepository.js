import { con } from "./connection.js";



export async function listMamiferos() {
  const command = `
    select *
     from mamiferos
  `

  const [linhas] = await con.query(command);
  return linhas;
}

export async function listAves() {
  const command = `
    select *
     from aves
  `

  const [linhas] = await con.query(command);
  return linhas;
}

export async function listRepteis() {
  const command = `
    select *
     from repteis
  `

  const [linhas] = await con.query(command);
  return linhas;
}

export async function listAnfibios() {
  const command = `
    select *
     from anfibios
  `

  const [linhas] = await con.query(command);
  return linhas;
}

export async function listPeixes() {
  const command = `
    select *
     from peixes
  `

  const [linhas] = await con.query(command);
  return linhas;
}

export async function listInvertebrados() {
  const command = `
    select *
     from invertebrados
  `

  const [linhas] = await con.query(command);
  return linhas;
}

export async function listAnimais() {
  const command = `
    SELECT *
    FROM (

      SELECT
        id_animal,
        nome_popular,
        nome_cientifico,
        classificacao,
        habitat,
        alimentacao,
        reproducao,
        caracteristicas,
        curiosidade,
        classe_especie
      FROM mamiferos
      INNER JOIN pesquisa_especie
      ON mamiferos.id_especie = pesquisa_especie.id_especie

      UNION ALL

      SELECT
        id_animal,
        nome_popular,
        nome_cientifico,
        classificacao,
        habitat,
        alimentacao,
        reproducao,
        caracteristicas,
        curiosidade,
        classe_especie
      FROM aves
      INNER JOIN pesquisa_especie
      ON aves.id_especie = pesquisa_especie.id_especie

      UNION ALL

      SELECT
        id_animal,
        nome_popular,
        nome_cientifico,
        classificacao,
        habitat,
        alimentacao,
        reproducao,
        caracteristicas,
        curiosidade,
        classe_especie
      FROM repteis
      INNER JOIN pesquisa_especie
      ON repteis.id_especie = pesquisa_especie.id_especie

      UNION ALL

      SELECT
        id_animal,
        nome_popular,
        nome_cientifico,
        classificacao,
        habitat,
        alimentacao,
        reproducao,
        caracteristicas,
        curiosidade,
        classe_especie
      FROM anfibios
      INNER JOIN pesquisa_especie
      ON anfibios.id_especie = pesquisa_especie.id_especie

      UNION ALL

      SELECT
        id_animal,
        nome_popular,
        nome_cientifico,
        classificacao,
        habitat,
        alimentacao,
        reproducao,
        caracteristicas,
        curiosidade,
        classe_especie
      FROM peixes
      INNER JOIN pesquisa_especie
      ON peixes.id_especie = pesquisa_especie.id_especie

      UNION ALL

      SELECT
        id_animal,
        nome_popular,
        nome_cientifico,
        classificacao,
        habitat,
        alimentacao,
        reproducao,
        caracteristicas,
        curiosidade,
        classe_especie
      FROM invertebrados
      INNER JOIN pesquisa_especie
      ON invertebrados.id_especie = pesquisa_especie.id_especie

    ) AS animais;

   
  `;

  const [linhas] = await con.query(command);
  return linhas;
}

export async function listAnimaisPesquisa(nome) {
  const command = `
    SELECT *
    FROM (

      SELECT
        id_animal,
        nome_popular,
        nome_cientifico,
        classificacao,
        habitat,
        alimentacao,
        reproducao,
        caracteristicas,
        curiosidade,
        classe_especie
      FROM mamiferos
      INNER JOIN pesquisa_especie
      ON mamiferos.id_especie = pesquisa_especie.id_especie

      UNION ALL

      SELECT
        id_animal,
        nome_popular,
        nome_cientifico,
        classificacao,
        habitat,
        alimentacao,
        reproducao,
        caracteristicas,
        curiosidade,
        classe_especie
      FROM aves
      INNER JOIN pesquisa_especie
      ON aves.id_especie = pesquisa_especie.id_especie

      UNION ALL

      SELECT
        id_animal,
        nome_popular,
        nome_cientifico,
        classificacao,
        habitat,
        alimentacao,
        reproducao,
        caracteristicas,
        curiosidade,
        classe_especie
      FROM repteis
      INNER JOIN pesquisa_especie
      ON repteis.id_especie = pesquisa_especie.id_especie

      UNION ALL

      SELECT
        id_animal,
        nome_popular,
        nome_cientifico,
        classificacao,
        habitat,
        alimentacao,
        reproducao,
        caracteristicas,
        curiosidade,
        classe_especie
      FROM anfibios
      INNER JOIN pesquisa_especie
      ON anfibios.id_especie = pesquisa_especie.id_especie

      UNION ALL

      SELECT
        id_animal,
        nome_popular,
        nome_cientifico,
        classificacao,
        habitat,
        alimentacao,
        reproducao,
        caracteristicas,
        curiosidade,
        classe_especie
      FROM peixes
      INNER JOIN pesquisa_especie
      ON peixes.id_especie = pesquisa_especie.id_especie

      UNION ALL

      SELECT
        id_animal,
        nome_popular,
        nome_cientifico,
        classificacao,
        habitat,
        alimentacao,
        reproducao,
        caracteristicas,
        curiosidade,
        classe_especie
      FROM invertebrados
      INNER JOIN pesquisa_especie
      ON invertebrados.id_especie = pesquisa_especie.id_especie

    ) AS animais

    WHERE nome_popular LIKE ?;
  `;

  const [linhas] = await con.query(command, [`${nome}%`]);
  return linhas;
}