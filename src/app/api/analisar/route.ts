import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

const client = new Anthropic();

const PROMPT = `Você é um especialista em Código de Trânsito Brasileiro (CTB) e defesa de multas. Analise esta notificação de multa de trânsito e retorne um JSON com a seguinte estrutura (apenas JSON, sem markdown):

{
  "dadosExtraidos": {
    "numeroAuto": "número do auto de infração",
    "orgaoAutuador": "órgão que emitiu a multa",
    "dataInfracao": "data da infração",
    "prazoRecurso": "prazo para recurso",
    "valorMulta": "valor em reais",
    "pontosCarteira": 0,
    "codigoInfracao": "código da infração",
    "descricaoInfracao": "descrição completa",
    "artigoCtb": "artigo do CTB aplicado",
    "gravidade": "Leve/Média/Grave/Gravíssima",
    "localInfracao": "local onde ocorreu",
    "veiculo": "placa e modelo se disponível",
    "condutor": "nome do condutor se disponível"
  },
  "analise": {
    "probabilidadeExito": 70,
    "classificacaoRisco": "Alto/Médio/Baixo",
    "fundamentosJuridicos": ["fundamento 1", "fundamento 2", "fundamento 3"],
    "estrategiaDefesa": ["passo 1", "passo 2", "passo 3"],
    "pontosFracosProsecucao": ["ponto fraco 1", "ponto fraco 2"],
    "prazoUrgente": false
  },
  "penalidades": {
    "semRecurso": ["penalidade 1", "penalidade 2", "penalidade 3"],
    "riscoSuspensao": false,
    "impactoProfissional": "descrição do impacto para motoristas profissionais"
  },
  "beneficiosRecurso": ["benefício 1", "benefício 2", "benefício 3"],
  "argumentosVenda": {
    "risco": "argumento focado no risco de não recorrer",
    "juridico": "argumento jurídico principal",
    "urgencia": "argumento de urgência",
    "beneficio": "principal benefício de contratar"
  },
  "scriptAtendimento": "texto completo do script de abertura para o consultor apresentar a análise ao cliente",
  "precificacao": {
    "valorMinimo": 150,
    "valorRecomendado": 250,
    "valorTeto": 400,
    "justificativa": "justificativa para o preço recomendado"
  }
}`;

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
