import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

const client = new Anthropic();

function buildPrompt(perfil: string, totalMultas: number): string {
  const perfilInfo = {
    ppd: {
      label: 'PPD (Permissão Para Dirigir)',
      regra: `REGRAS PPD — CRÍTICO:
- Limite sempre 20 pontos (período 12 meses)
- 1 infração GRAVE = CASSAÇÃO IMEDIATA da PPD
- 1 infração GRAVÍSSIMA = CASSAÇÃO IMEDIATA da PPD  
- 2 infrações MÉDIAS = CASSAÇÃO IMEDIATA da PPD
- Cassação = reinicia prazo de 2 anos do zero + refazer todo processo
- Argumento: foco em PERDA TOTAL DA HABILITAÇÃO`,
    },
    definitiva: {
      label: 'CNH Definitiva (condutor comum)',
      regra: `REGRAS CNH DEFINITIVA (período 12 meses):
- Infração GRAVÍSSIMA presente: limite 20 pontos para suspensão
- Infração GRAVE (sem gravíssima): limite 30 pontos
- Só leves/médias: limite 40 pontos
- Cassação: 3 suspensões acumuladas, dirigir durante suspensão, reincidência criminal
- Argumento: foco no período sem poder dirigir + custos indiretos`,
    },
    ear: {
      label: 'EAR — Exerce Atividade Remunerada (motorista profissional)',
      regra: `REGRAS EAR (período 12 meses):
- Limite SEMPRE FIXO em 40 pontos — grave ou gravíssima NÃO reduz o limite
- Suspensão = perda imediata do emprego e sustento
- CNH profissional (cat. C/D/E) é longa e cara para retirar novamente
- Argumento: foco em PERDA DO EMPREGO e sustento da família`,
    },
  }[perfil] || { label: 'CNH Definitiva', regra: 'Aplicar regras gerais do CTB.' }

  const multiplosTxt = totalMultas > 1
    ? `ATENÇÃO: Este condutor possui ${totalMultas} notificações. Analise TODAS, extraia os dados de cada uma e faça a SOMATÓRIA TOTAL de pontos. Verifique se a soma já ultrapassou o limite do perfil ${perfilInfo.label}. O dossiê deve ser CONSOLIDADO — uma análise única considerando todas as infrações juntas.`
    : `Este condutor possui 1 notificação. Analise e gere o dossiê completo.`

  return `Você é o sistema de análise jurídica da MG Multas — especializada em recursos de multas de trânsito no Brasil.

PERFIL DO CONDUTOR: ${perfilInfo.label}
${perfilInfo.regra}

${multiplosTxt}

RETORNE APENAS JSON VÁLIDO, sem markdown. Estrutura EXATA:

{
  "extraido": {
    "numero_auto": "se múltiplas, liste todas separadas por vírgula",
    "data_infracao": "se múltiplas, a mais recente ou liste todas",
    "orgao_autuador": "órgão(s) autuador(es)",
    "local_infracao": "local(is) da(s) infração(ões)",
    "codigo_infracao": "código(s) da(s) infração(ões)",
    "descricao_infracao": "se múltiplas: 'X infrações: descrição1 + descrição2...'",
    "gravidade": "a mais grave entre todas as infrações: Leve|Média|Grave|Gravíssima",
    "pontos_adicionar": SOMA TOTAL de pontos de todas as infrações,
    "valor_multa": "SOMA TOTAL de todos os valores em R$",
    "prazo_recurso": "prazo mais próximo entre todas as notificações",
    "dias_restantes": dias até o prazo mais urgente,
    "tipo_documento": "tipo(s) de documento(s)",
    "artigo_ctb": "artigo(s) do CTB aplicáveis",
    "instancia_recurso": "instância mais adequada considerando todas",
    "indicacao_condutor_possivel": true ou false,
    "risco_suspensao": true se a soma de pontos atingir o limite do perfil,
    "risco_cassacao": true se cassação for aplicável conforme perfil e infrações
  },
  "analise": {
    "probabilidade_exito": número 0-100 considerando todas as infrações,
    "nivel_chance": "Alta|Média|Baixa",
    "resumo_tecnico": "USO INTERNO — análise consolidada de todas as infrações, soma de pontos, risco real e estratégia geral",
    "fundamentos_juridicos": ["fundamento 1", "fundamento 2", "fundamento 3"],
    "pontos_atacar": ["ponto fraco 1", "ponto fraco 2"],
    "estrategia_defesa": "estratégia consolidada para todas as infrações"
  },
  "venda": {
    "penalidades_sem_recurso": [
      {"tipo": "Total de Multas", "valor": "R$ X.XXX,XX", "nivel": "critico", "descricao": "soma de todas as multas sem recorrer"},
      {"tipo": "Pontos Totais na CNH", "valor": "X pontos acumulados", "nivel": "critico", "descricao": "total somado de todas as infrações vs limite do perfil"},
      {"tipo": "Situação da CNH", "valor": "Suspensão|Cassação|Em risco", "nivel": "critico", "descricao": "situação real considerando soma de pontos e perfil do condutor"},
      {"tipo": "Impacto Financeiro Total", "valor": "R$ X.XXX,XX", "nivel": "grave", "descricao": "multas + custos indiretos estimados"}
    ],
    "beneficios_recurso": [
      "Recorremos nas 3 instâncias administrativas cabíveis (Defesa Prévia, JARI e CETRAN/CONTRAN)",
      "Analisamos todas as notificações em conjunto para a melhor estratégia consolidada",
      "Nossa equipe cuida de todo o processo — você não precisa fazer nada",
      "benefício específico considerando o perfil e quantidade de infrações"
    ],
    "argumentos_venda": [
      {
        "tipo": "perigo",
        "titulo": "título sobre o risco total e concreto",
        "corpo": "Mostre o impacto TOTAL: soma das multas, total de pontos, risco de suspensão/cassação. PROIBIDO: mencionar erros técnicos, artigos, irregularidades do auto."
      },
      {
        "tipo": "juridico",
        "titulo": "título de autoridade da MG Multas",
        "corpo": "Transmita autoridade SEM revelar o mérito. Ex: 'Nossa equipe analisou todas as notificações e identificou aspectos relevantes em cada uma. Atuamos nas 3 instâncias cabíveis com estratégia consolidada.' NUNCA explique o que está errado ou como será feito."
      },
      {
        "tipo": "urgencia",
        "titulo": "título com prazo mais urgente entre as notificações",
        "corpo": "Use o prazo mais próximo. Mostre o que o cliente perde ao deixar passar. PROIBIDO: % numérico e detalhes jurídicos."
      },
      {
        "tipo": "beneficio",
        "titulo": "título do benefício financeiro total",
        "corpo": "Compare o investimento no serviço com o custo total de não recorrer em nenhuma das notificações. Use 'alta probabilidade de êxito' se probabilidade_exito >= 50, ou 'perspectivas favoráveis' se menor. NUNCA use % numérico. NUNCA revele o que está errado."
      }
    ],
    "script_abertura": "Script 4-6 linhas considerando que são ${totalMultas} notificação(ões). REGRAS: (1) NUNCA % numérico; (2) NUNCA revelar erros ou estratégia; (3) Mencionar as 3 instâncias; (4) Urgência com o prazo mais próximo; (5) Destacar que analisamos o caso completo do condutor de forma consolidada.",
    "preco_minimo": número inteiro,
    "preco_recomendado": número inteiro,
    "preco_maximo": número inteiro,
    "justificativa_preco": "justificativa baseada no total de infrações, gravidade e perfil"
  }
}

PRECIFICAÇÃO (base por infração mais grave, acumulada):
- Leve: min R$150, rec R$200, max R$300
- Média: min R$200, rec R$300, max R$400
- Grave: min R$300, rec R$400, max R$500
- Gravíssima: min R$400, rec R$500, max R$700
- Cada infração adicional: +R$100 no recomendado
- Risco suspensão: +R$100
- Risco cassação: +R$200
- PPD: +R$150
- EAR: +R$100

LEI DE OURO — JAMAIS VIOLAR:
PROIBIDO nos argumentos e script: % numérico, erros/falhas do auto, artigos, jurisprudências, como será feito o recurso.
PERMITIDO: "alta probabilidade de êxito" (>=50) ou "perspectivas favoráveis" (<50), valores totais, pontos, risco concreto, especialização MG Multas, 3 instâncias.`
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll("files") as File[]
    const perfil = (formData.get("perfil") as string) || "definitiva"
    const totalMultas = files.length

    if (files.length === 0) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })
    }

    const prompt = buildPrompt(perfil, totalMultas)

    // Monta o conteúdo com todos os arquivos
    const contentBlocks: Anthropic.MessageParam["content"] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const bytes = await file.arrayBuffer()
      const base64 = Buffer.from(bytes).toString("base64")
      const isPdf = file.type === "application/pdf"

      // Separador entre documentos
      contentBlocks.push({
        type: "text",
        text: `--- NOTIFICAÇÃO ${i + 1} de ${totalMultas} ---`,
      })

      if (isPdf) {
        contentBlocks.push({
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: base64 },
        } as Anthropic.DocumentBlockParam)
      } else {
        const imgType = file.type as "image/jpeg" | "image/png" | "image/webp" | "image/gif"
        contentBlocks.push({
          type: "image",
          source: { type: "base64", media_type: imgType, data: base64 },
        } as Anthropic.ImageBlockParam)
      }
    }

    contentBlocks.push({ type: "text", text: prompt })

    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 4000,
      messages: [{ role: "user", content: contentBlocks }],
    })

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
