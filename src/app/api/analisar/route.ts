import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

const client = new Anthropic();

function buildPrompt(perfil: string): string {
  const perfilInfo = {
    ppd: {
      label: 'PPD (Permissão Para Dirigir)',
      regra: `REGRAS ESPECÍFICAS PARA PPD:
- Limite sempre 20 pontos — sem exceção
- 1 infração GRAVE nos últimos 12 meses = CASSAÇÃO IMEDIATA da PPD
- 1 infração GRAVÍSSIMA nos últimos 12 meses = CASSAÇÃO IMEDIATA da PPD
- 2 infrações MÉDIAS nos últimos 12 meses = CASSAÇÃO IMEDIATA da PPD
- Cassação = reinicia prazo de 2 anos do zero + tem que refazer todo o processo
- Argumento de venda: foco em PERDA TOTAL DA HABILITAÇÃO, não apenas suspensão`,
    },
    definitiva: {
      label: 'CNH Definitiva (condutor comum)',
      regra: `REGRAS ESPECÍFICAS PARA CNH DEFINITIVA:
- Tem infração GRAVÍSSIMA nos últimos 12 meses: limite de 20 pontos para suspensão
- Tem infração GRAVE (sem gravíssima) nos últimos 12 meses: limite de 30 pontos
- Apenas infrações leves/médias nos últimos 12 meses: limite de 40 pontos
- Cassação ocorre em: 3 suspensões acumuladas, dirigir durante suspensão, reincidência em crime de trânsito
- Argumento de venda: foco no período sem poder dirigir + custos indiretos`,
    },
    ear: {
      label: 'EAR — Exerce Atividade Remunerada (motorista profissional)',
      regra: `REGRAS ESPECÍFICAS PARA EAR (MOTORISTA PROFISSIONAL):
- Limite SEMPRE FIXO em 40 pontos — independente do tipo de infração (grave ou gravíssima não reduz o limite)
- Período de avaliação: últimos 12 meses
- Suspensão impacta diretamente o SUSTENTO e o EMPREGO do condutor
- Retirar nova CNH profissional (cat. C, D, E) é processo longo e caro
- Argumento de venda: foco na PERDA DO EMPREGO e sustento da família — argumento mais emocional e urgente`,
    },
  }[perfil] || { label: 'Não informado', regra: 'Aplicar regras gerais do CTB.' }

  return `Você é o sistema de análise jurídica da MG Multas — empresa especializada em recursos de multas de trânsito no Brasil.

PERFIL DO CONDUTOR: ${perfilInfo.label}

${perfilInfo.regra}

Analise a notificação considerando OBRIGATORIAMENTE o perfil acima para calcular risco real de suspensão/cassação e personalizar os argumentos de venda.

RETORNE APENAS JSON VÁLIDO, sem markdown. Estrutura EXATA:

{
  "extraido": {
    "numero_auto": "string ou Não identificado",
    "data_infracao": "DD/MM/AAAA ou Não identificado",
    "orgao_autuador": "string ou Não identificado",
    "local_infracao": "string ou Não identificado",
    "codigo_infracao": "string ou Não identificado",
    "descricao_infracao": "descrição da infração",
    "gravidade": "Leve|Média|Grave|Gravíssima",
    "pontos_adicionar": número inteiro,
    "valor_multa": "R$ X,XX",
    "prazo_recurso": "DD/MM/AAAA ou estimativa",
    "dias_restantes": número inteiro,
    "tipo_documento": "Auto de Infração|Notificação de Autuação|Notificação de Penalidade|Outro",
    "artigo_ctb": "Ex: Art. 218 §3º do CTB",
    "instancia_recurso": "Defesa Prévia|JARI|CETRAN|CONTRAN",
    "indicacao_condutor_possivel": true ou false,
    "risco_suspensao": true ou false,
    "risco_cassacao": true ou false
  },
  "analise": {
    "probabilidade_exito": número 0-100,
    "nivel_chance": "Alta|Média|Baixa",
    "resumo_tecnico": "USO INTERNO — análise técnica com irregularidades, fundamentos e estratégia considerando o perfil ${perfilInfo.label}",
    "fundamentos_juridicos": ["argumento jurídico completo 1", "argumento 2", "argumento 3"],
    "pontos_atacar": ["ponto fraco 1", "ponto fraco 2"],
    "estrategia_defesa": "estratégia interna completa para equipe jurídica"
  },
  "venda": {
    "penalidades_sem_recurso": [
      {"tipo": "Multa Financeira", "valor": "R$ X,XX", "nivel": "critico", "descricao": "valor exato da multa"},
      {"tipo": "Pontos na CNH", "valor": "X pontos", "nivel": "grave", "descricao": "impacto considerando perfil ${perfilInfo.label}"},
      {"tipo": "Risco de ${perfil === 'ppd' ? 'Cassação da PPD' : perfil === 'ear' ? 'Suspensão e Perda do Emprego' : 'Suspensão da CNH'}", "valor": "${perfil === 'ppd' ? 'Cassação imediata' : 'até 12 meses'}", "nivel": "critico", "descricao": "risco real considerando o perfil do condutor"},
      {"tipo": "Impacto Financeiro Total", "valor": "R$ X.XXX,XX", "nivel": "grave", "descricao": "soma de todos os custos diretos e indiretos"}
    ],
    "beneficios_recurso": [
      "Recorremos nas 3 instâncias administrativas cabíveis (Defesa Prévia, JARI e CETRAN/CONTRAN)",
      "Nossa equipe cuida de todo o processo — você não precisa fazer nada",
      "benefício específico para o perfil ${perfilInfo.label}",
      "benefício concreto adicional"
    ],
    "argumentos_venda": [
      {
        "tipo": "perigo",
        "titulo": "título sobre risco concreto para perfil ${perfilInfo.label}",
        "corpo": "Descreva o risco real e específico para este perfil: ${perfil === 'ppd' ? 'perda total da habilitação e reinício do prazo de 2 anos' : perfil === 'ear' ? 'perda do emprego e sustento da família' : 'período sem poder dirigir e custos indiretos'}. PROIBIDO: mencionar erros técnicos, artigos, irregularidades do auto."
      },
      {
        "tipo": "juridico",
        "titulo": "título de autoridade da MG Multas",
        "corpo": "Transmita autoridade SEM revelar o mérito. Exemplo: 'Nossa equipe analisou sua notificação e identificou aspectos relevantes que podem ser explorados no recurso. Atuamos nas 3 instâncias cabíveis e temos experiência sólida nesse tipo de caso.' NUNCA explique o que está errado ou como será feito o recurso."
      },
      {
        "tipo": "urgencia",
        "titulo": "título com prazo real e consequência de perder",
        "corpo": "Use o prazo real. Mostre o que o cliente perde ao deixar passar. PROIBIDO: % numérico e detalhes jurídicos."
      },
      {
        "tipo": "beneficio",
        "titulo": "título do benefício financeiro e pessoal",
        "corpo": "Compare o custo do serviço com o custo de não recorrer. Use 'alta probabilidade de êxito' se probabilidade_exito >= 50, ou 'perspectivas favoráveis' se menor. NUNCA use % numérico. NUNCA revele o que está errado."
      }
    ],
    "script_abertura": "Script 4-6 linhas personalizado para perfil ${perfilInfo.label}. REGRAS: (1) NUNCA % numérico — use 'alta probabilidade de êxito' se >= 50 ou 'perspectivas favoráveis' se menor; (2) NUNCA revelar erros, artigos ou estratégia; (3) Mencionar as 3 instâncias cabíveis; (4) Urgência com prazo real; (5) Para EAR: mencionar impacto no emprego. Para PPD: mencionar risco de cassação e reinício do prazo.",
    "preco_minimo": número inteiro,
    "preco_recomendado": número inteiro,
    "preco_maximo": número inteiro,
    "justificativa_preco": "justificativa baseada na gravidade e perfil do condutor"
  }
}

PRECIFICAÇÃO:
- Leve: min R$150, rec R$200, max R$300
- Média: min R$200, rec R$300, max R$400
- Grave: min R$300, rec R$400, max R$500
- Gravíssima: min R$400, rec R$500, max R$700
- Risco suspensão: +R$100 no recomendado
- Risco cassação: +R$200 no recomendado
- PPD: +R$150 (risco de cassação imediata)
- EAR: +R$100 (impacto no emprego)

LEI DE OURO — JAMAIS VIOLAR:
Os argumentos de venda e o script são lidos DIRETAMENTE AO CLIENTE.
PROIBIDO: % numérico, erros/falhas do auto, artigos, jurisprudências, como será feito o recurso.
PERMITIDO: "alta probabilidade de êxito" (>=50) ou "perspectivas favoráveis" (<50), valor da multa, pontos, risco concreto, especialização da MG Multas, 3 instâncias.
MOTIVO: Se o cliente souber o que está errado, ele recorre sozinho. O mérito jurídico é o produto da MG Multas.`
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const perfil = (formData.get("perfil") as string) || "definitiva"

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString("base64")
    const isPdf = file.type === "application/pdf"
    const prompt = buildPrompt(perfil)

    let response

    if (isPdf) {
      response = await client.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 4000,
        messages: [{
          role: "user",
          content: [
            { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } },
            { type: "text", text: prompt },
          ],
        }],
      })
    } else {
      const imgType = file.type as "image/jpeg" | "image/png" | "image/webp" | "image/gif"
      response = await client.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 4000,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: imgType, data: base64 } },
            { type: "text", text: prompt },
          ],
        }],
      })
    }

    const textContent = response.content.find((block) => block.type === "text")
    if (!textContent || textContent.type !== "text") throw new Error("Resposta inválida da IA")

    const cleanJson = textContent.text.replace(/```json|```/g, "").trim()
    const resultado = JSON.parse(cleanJson)

    return NextResponse.json(resultado)
  } catch (error) {
    console.error("Erro na análise:", error)
    const message = error instanceof Error ? error.message : "Erro desconhecido"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
