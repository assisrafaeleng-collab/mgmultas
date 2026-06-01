import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

const client = new Anthropic();

const PROMPT = `Você é um especialista em Código de Trânsito Brasileiro (CTB) e defesa de multas. Analise esta notificação de multa de trânsito e retorne APENAS um JSON válido, sem markdown, sem texto adicional, com esta estrutura exata:

{
  "extraido": {
    "numero_auto": "número do auto de infração",
    "data_infracao": "data da infração",
    "orgao_autuador": "órgão autuador",
    "local_infracao": "local da infração",
    "codigo_infracao": "código da infração",
    "descricao_infracao": "descrição completa da infração",
    "gravidade": "Grave",
    "pontos_adicionar": 5,
    "valor_multa": "R$ 000,00",
    "prazo_recurso": "30 dias",
    "dias_restantes": 30,
    "tipo_documento": "Notificação de Autuação",
    "artigo_ctb": "Art. 000 do CTB",
    "instancia_recurso": "DETRAN/JARI",
    "indicacao_condutor_possivel": false,
    "risco_suspensao": false,
    "risco_cassacao": false
  },
  "analise": {
    "probabilidade_exito": 70,
    "nivel_chance": "Média",
    "resumo_tecnico": "resumo técnico da análise",
    "fundamentos_juridicos": ["fundamento 1", "fundamento 2", "fundamento 3"],
    "pontos_atacar": ["ponto fraco 1", "ponto fraco 2"],
    "estrategia_defesa": "descrição da estratégia de defesa recomendada"
  },
  "venda": {
    "penalidades_sem_recurso": [
      { "tipo": "Multa", "valor": "R$ 000,00", "nivel": "grave", "descricao": "descrição da penalidade" },
      { "tipo": "Pontos", "valor": "X pontos na CNH", "nivel": "moderado", "descricao": "descrição do impacto dos pontos" }
    ],
    "beneficios_recurso": ["benefício 1", "benefício 2", "benefício 3"],
    "argumentos_venda": [
      { "tipo": "perigo", "titulo": "título do argumento de perigo", "corpo": "corpo do argumento" },
      { "tipo": "juridico", "titulo": "título do argumento jurídico", "corpo": "corpo do argumento" },
      { "tipo": "urgencia", "titulo": "título do argumento de urgência", "corpo": "corpo do argumento" },
      { "tipo": "beneficio", "titulo": "título do benefício", "corpo": "corpo do argumento" }
    ],
    "script_abertura": "texto completo do script para o consultor apresentar ao cliente",
    "preco_minimo": 150,
    "preco_recomendado": 300,
    "preco_maximo": 500,
    "justificativa_preco": "justificativa para o preço recomendado"
  }
}

Para gravidade use exatamente: "Leve", "Média", "Grave" ou "Gravíssima"
Para nivel_chance use exatamente: "Alta", "Média" ou "Baixa"
Para nivel das penalidades use exatamente: "critico", "grave" ou "moderado"
Para tipo dos argumentos use exatamente: "perigo", "juridico", "urgencia" ou "beneficio"`;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const isPdf = file.type === "application/pdf";

    let response;

    if (isPdf) {
      response = await client.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: {
                  type: "base64",
                  media_type: "application/pdf",
                  data: base64,
                },
              },
              { type: "text", text: PROMPT },
            ],
          },
        ],
      });
    } else {
      const imgType = file.type as "image/jpeg" | "image/png" | "image/webp" | "image/gif";
      response = await client.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: imgType,
                  data: base64,
                },
              },
              { type: "text", text: PROMPT },
            ],
          },
        ],
      });
    }

    const textContent = response.content.find((block) => block.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("Resposta inválida da IA");
    }

    const cleanJson = textContent.text.replace(/```json|```/g, "").trim();
    const resultado = JSON.parse(cleanJson);

    return NextResponse.json(resultado);
  } catch (error) {
    console.error("Erro na análise:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
