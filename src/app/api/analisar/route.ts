import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { SYSTEM_PROMPT } from '@/lib/prompt'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 })
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Formato não suportado. Use PDF, JPG ou PNG.' }, { status: 400 })
    }

    const maxSize = 20 * 1024 * 1024 // 20MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'Arquivo muito grande. Máximo 20MB.' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const mediaType = file.type as 'application/pdf' | 'image/jpeg' | 'image/png' | 'image/webp'

    // Build content block based on file type
    const contentBlock = mediaType === 'application/pdf'
      ? {
          type: 'document' as const,
          source: {
            type: 'base64' as const,
            media_type: 'application/pdf' as const,
            data: base64,
          },
        }
      : {
          type: 'image' as const,
          source: {
            type: 'base64' as const,
            media_type: mediaType,
            data: base64,
          },
        }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            contentBlock,
            {
              type: 'text',
              text: 'Analise esta notificação de infração de trânsito e retorne o JSON conforme instruído. Se não conseguir ler algum campo claramente, estime com base no contexto visível.',
            },
          ],
        },
      ],
    })

    const rawText = response.content.find(b => b.type === 'text')?.text ?? '{}'
    const clean = rawText.replace(/```json|```/g, '').trim()

    let resultado
    try {
      resultado = JSON.parse(clean)
    } catch {
      return NextResponse.json(
        { error: 'Erro ao interpretar resposta da IA. Tente novamente.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ resultado })
  } catch (err: unknown) {
    console.error('[analisar] erro:', err)
    const message = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export const config = {
  api: { bodyParser: false },
}
