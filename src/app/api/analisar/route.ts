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
- Cassação: 3 suspensões acumuladas, dirigir durante suspensão, reincidência criminal`,
    },
    ear: {
      label: 'EAR — Exerce Atividade Remunerada (motorista profissional)',
      regra: `REGRAS EAR (período 12 meses):
- Limite SEMPRE FIXO em 40 pontos — grave ou gravíssima NÃO reduz o limite
- Suspensão = perda imediata do emprego e sustento
- Argumento: foco em PERDA DO EMPREGO e sustento da família`,
    },
  }[perfil] || { label: 'CNH Definitiva', regra: 'Aplicar regras gerais do CTB.' }

  const multiplosTxt = totalMultas > 1
    ? `ATENÇÃO: Este condutor possui ${totalMultas} notificações. Analise TODAS, extraia os dados de cada uma e faça a SOMATÓRIA TOTAL de pontos. Verifique se a soma ultrapassou o limite do perfil. O dossiê deve ser CONSOLIDADO.`
    : `Este condutor possui 1 notificação. Analise e gere o dossiê completo.`

  return `Você é o sistema de análise jurídica da MG Multas — especializada em recursos de multas de trânsito no Brasil.

PERFIL DO CONDUTOR: ${perfilInfo.label}
${perfilInfo.regra}

${multiplosTxt}

═══════════════════════════════════════════════
TABELA DE PREÇOS OFICIAL MG MULTAS
═══════════════════════════════════════════════

TABELA 1 — RECURSO E DEFESA (sem risco de suspensão/cassação):
Valor da infração até R$88,38    → serviço R$80,00
Valor da infração até R$130,16   → serviço R$80,00
Valor da infração até R$195,23   → serviço R$110,00
Valor da infração até R$293,47   → serviço R$170,00
Valor da infração até R$586,94   → serviço R$270,00
Valor da infração até R$880,41   → serviço R$330,00
Valor da infração até R$1.467,35 → serviço R$550,00

TABELA 2 — MULTAS AUTO SUSPENSIVAS (escrito na multa "passível de autossuspensão"):
Lei Seca (sempre auto suspensiva) → R$2.300,00 por multa
Outra multa auto suspensiva (não Lei Seca) → R$1.600,00 por multa

TABELA 3 — PROCESSO ADMINISTRATIVO POR ACÚMULO DE PONTOS:
(quando somatória de pontos ultrapassa limite do perfil)
- CNH Definitiva ou EAR: Processo Administrativo por pontuação → R$1.600,00
- PPD: RGP-PAP → R$1.600,00
Sobre o PA: cobra-se R$1.600 da instauração + valor Tabela 1 de CADA multa do condutor

TABELA 4 — CASSAÇÃO:
RGP Cassação ou PA Cassação → R$2.300,00 fixo

═══════════════════════════════════════════════
LÓGICA DE PRECIFICAÇÃO — SIGA EXATAMENTE:
═══════════════════════════════════════════════

Para CADA multa do condutor, classifique:
1. É Lei Seca? → R$2.300
2. Está escrito "passível de autossuspensão" (não Lei Seca)? → R$1.600
3. Não é auto suspensiva? → use Tabela 1 pelo valor da multa

Depois verifique o cenário geral:
- CENÁRIO A (sem suspensão): soma apenas os valores individuais de cada multa
- CENÁRIO B (com suspensão por acúmulo de pontos): R$1.600 PA/RGP-PAP + soma Tabela 1 de todas as multas
- CENÁRIO C (cassação): R$2.300 fixo
- CENÁRIO D (Lei Seca): R$2.300 por cada Lei Seca + valor individual das demais

MEMÓRIA DE CÁLCULO: No campo "memoria_calculo" detalhe linha a linha:
Ex: "Multa 1 (Lei Seca R$2.934,70) → R$2.300 | Multa 2 (R$293,47 não auto suspensiva) → R$170 | TOTAL: R$2.470"

TIPO DE DOCUMENTO — IMPORTANTE:
- "Notificação de Autuação": condutor PODE indicar outro condutor, tem prazo de defesa prévia
- "Notificação de Penalidade": NÃO pode mais indicar condutor, prazo de recurso diferente

RETORNE APENAS JSON VÁLIDO, sem markdown. Estrutura EXATA:

{
  "extraido": {
    "numero_auto": "se múltiplas, liste todas separadas por vírgula",
    "data_infracao": "se múltiplas, liste todas",
    "orgao_autuador": "órgão(s) autuador(es)",
    "local_infracao": "local(is) da(s) infração(ões)",
    "codigo_infracao": "código(s) da(s) infração(ões)",
    "descricao_infracao": "se múltiplas: 'X infrações: desc1 + desc2...'",
    "gravidade": "a mais grave entre todas: Leve|Média|Grave|Gravíssima",
    "pontos_adicionar": SOMA TOTAL de pontos de todas as infrações,
    "valor_multa": "SOMA TOTAL em R$ de todas as multas",
    "prazo_recurso": "prazo mais urgente entre todas",
    "dias_restantes": dias até o prazo mais urgente,
    "tipo_documento": "Notificação de Autuação|Notificação de Penalidade|Misto",
    "artigo_ctb": "artigo(s) do CTB aplicáveis",
    "instancia_recurso": "Defesa Prévia|JARI|CETRAN|CONTRAN",
    "indicacao_condutor_possivel": true somente se tipo_documento for Notificação de Autuação,
    "risco_suspensao": true se somatória atingir limite do perfil,
    "risco_cassacao": true se cassação aplicável,
    "auto_suspensivas": ["descrição das multas auto suspensivas identificadas"],
    "lei_seca_identificada": true ou false
  },
  "analise": {
    "probabilidade_exito": número 0-100,
    "nivel_chance": "Alta|Média|Baixa",
    "resumo_tecnico": "USO INTERNO — análise consolidada com soma de pontos, cenário identificado e estratégia",
    "fundamentos_juridicos": ["fundamento 1", "fundamento 2", "fundamento 3"],
    "pontos_atacar": ["ponto fraco 1", "ponto fraco 2"],
    "estrategia_defesa": "estratégia interna para equipe jurídica"
  },
  "venda": {
    "penalidades_sem_recurso": [
      {"tipo": "Total de Multas", "valor": "R$ X.XXX,XX", "nivel": "critico", "descricao": "soma de todas as multas sem recorrer"},
      {"tipo": "Pontos Totais na CNH", "valor": "X pontos acumulados", "nivel": "critico", "descricao": "total vs limite do perfil ${perfilInfo.label}"},
      {"tipo": "Situação da CNH", "valor": "Suspensão|Cassação|Em risco", "nivel": "critico", "descricao": "situação real do condutor"},
      {"tipo": "Impacto Financeiro Total", "valor": "R$ X.XXX,XX", "nivel": "grave", "descricao": "multas + custos indiretos estimados"}
    ],
    "beneficios_recurso": [
      "Recorremos nas 3 instâncias administrativas cabíveis (Defesa Prévia, JARI e CETRAN/CONTRAN)",
      "Analisamos todas as notificações em conjunto para a melhor estratégia consolidada",
      "Nossa equipe cuida de todo o processo — você não precisa fazer nada",
      "benefício específico para o perfil e quantidade de infrações"
    ],
    "argumentos_venda": [
      {
        "tipo": "perigo",
        "titulo": "título sobre risco total e concreto",
        "corpo": "Mostre impacto TOTAL: soma das multas, pontos, risco de suspensão/cassação. PROIBIDO: erros técnicos, artigos, irregularidades."
      },
      {
        "tipo": "juridico",
        "titulo": "título de autoridade da MG Multas",
        "corpo": "Transmita autoridade SEM revelar mérito. NUNCA explique o que está errado ou como será feito o recurso."
      },
      {
        "tipo": "urgencia",
        "titulo": "título com prazo mais urgente",
        "corpo": "Use o prazo mais próximo. PROIBIDO: % numérico e detalhes jurídicos."
      },
      {
        "tipo": "beneficio",
        "titulo": "título do benefício financeiro total",
        "corpo": "Compare investimento vs custo de não recorrer. Use 'alta probabilidade de êxito' se probabilidade_exito >= 50, ou 'perspectivas favoráveis' se menor. NUNCA use % numérico."
      }
    ],
    "script_abertura": "Script 4-6 linhas. NUNCA: % numérico, erros, estratégia jurídica. SEMPRE: 3 instâncias, prazo urgente, análise consolidada do caso.",
    "cenario_precificacao": "A|B|C|D — identifique o cenário aplicável",
    "memoria_calculo": "detalhamento linha a linha: Multa 1 (desc → valor serviço) | Multa 2 (desc → valor serviço) | + PA R$1.600 se aplicável | TOTAL: R$X",
    "preco_recomendado": número inteiro — SOMA TOTAL conforme regras acima,
    "preco_minimo": número inteiro — 10% abaixo do recomendado,
    "preco_maximo": número inteiro — 15% acima do recomendado,
    "justificativa_preco": "cite o cenário e a memória de cálculo resumida"
  }
}

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
    const contentBlocks: Anthropic.MessageParam["content"] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const bytes = await file.arrayBuffer()
      const base64 = Buffer.from(bytes).toString("base64")
      const isPdf = file.type === "application/pdf"

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
