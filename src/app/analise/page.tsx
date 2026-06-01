'use client'

import { useState, useRef, useCallback } from 'react'
import type { ResultadoAnalise } from '@/lib/types'
import ResultadoCard from '@/components/ResultadoCard'

const STEPS = [
  'Lendo e decodificando os documentos...',
  'Extraindo dados de cada notificação...',
  'Identificando artigos do CTB aplicáveis...',
  'Somando pontuação total do condutor...',
  'Calculando risco real de suspensão/cassação...',
  'Analisando probabilidade de êxito recursal...',
  'Gerando argumentos de venda personalizados...',
  'Finalizando dossiê consolidado...',
]

type PerfilCNH = 'ppd' | 'definitiva' | 'ear' | ''

const PERFIS = [
  {
    id: 'ppd' as PerfilCNH,
    label: 'PPD',
    sub: 'Permissão Para Dirigir',
    icon: 'ti-id-badge',
    alerta: '1 grave/gravíssima ou 2 médias = cassação imediata',
    cor: '#ef4444',
  },
  {
    id: 'definitiva' as PerfilCNH,
    label: 'CNH Definitiva',
    sub: 'Condutor comum',
    icon: 'ti-license',
    alerta: 'Limite varia: 20, 30 ou 40 pts conforme histórico (12 meses)',
    cor: '#f59e0b',
  },
  {
    id: 'ear' as PerfilCNH,
    label: 'EAR',
    sub: 'Exerce Atividade Remunerada',
    icon: 'ti-truck',
    alerta: 'Sempre 40 pontos — independente do tipo de infração',
    cor: '#3b82f6',
  },
]

export default function AnalisePage() {
  const [perfil, setPerfil] = useState<PerfilCNH>('')
  const [files, setFiles] = useState<File[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [stepIdx, setStepIdx] = useState(-1)
  const [resultado, setResultado] = useState<ResultadoAnalise | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  const handleFiles = useCallback((newFiles: File[]) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const valid = newFiles.filter(f => {
      if (!allowed.includes(f.type)) { alert(`Formato não suportado: ${f.name}`); return false }
      if (f.size > 20 * 1024 * 1024) { alert(`Arquivo muito grande: ${f.name}`); return false }
      return true
    })
    setFiles(prev => {
      const names = new Set(prev.map(f => f.name))
      return [...prev, ...valid.filter(f => !names.has(f.name))]
    })
    setResultado(null)
    setErro(null)
  }, [])

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    handleFiles(Array.from(e.dataTransfer.files))
  }

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx))
    setResultado(null)
    setErro(null)
  }

  const runAnalysis = async () => {
    if (files.length === 0 || !perfil) return
    setLoading(true)
    setErro(null)
    setResultado(null)
    setStepIdx(0)
    setProgress(0)

    let si = 0
    const timer = setInterval(() => {
      si++
      if (si < STEPS.length) {
        setStepIdx(si)
        setProgress(Math.round((si / STEPS.length) * 90))
      } else clearInterval(timer)
    }, 600)

    try {
      const fd = new FormData()
      files.forEach(f => fd.append('files', f))
      fd.append('perfil', perfil)
      fd.append('total_multas', String(files.length))

      const res = await fetch('/api/analisar', { method: 'POST', body: fd })
      const json = await res.json()

      clearInterval(timer)
      setProgress(100)
      setStepIdx(STEPS.length)

      if (!res.ok) throw new Error(json.error || 'Erro ao analisar')

      const dados: ResultadoAnalise = json

      try {
        const stored = JSON.parse(localStorage.getItem('mg_projetos') || '[]')
        stored.unshift({
          id: Date.now().toString(),
          criadoEm: new Date().toISOString(),
          perfil_cnh: perfil,
          total_multas: files.length,
          descricao_infracao: dados.extraido?.descricao_infracao || 'Múltiplas infrações',
          orgao_autuador: dados.extraido?.orgao_autuador || '—',
          artigo_ctb: dados.extraido?.artigo_ctb || '—',
          gravidade: dados.extraido?.gravidade || '—',
          probabilidade_exito: dados.analise?.probabilidade_exito || 0,
          preco_recomendado: dados.venda?.preco_recomendado || 300,
          risco_suspensao: dados.extraido?.risco_suspensao || false,
          risco_cassacao: dados.extraido?.risco_cassacao || false,
          dias_restantes: dados.extraido?.dias_restantes || 30,
          resultado: dados,
        })
        localStorage.setItem('mg_projetos', JSON.stringify(stored.slice(0, 100)))
      } catch (_) {}

      setTimeout(() => {
        setResultado(dados)
        setLoading(false)
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      }, 400)

    } catch (err: unknown) {
      clearInterval(timer)
      setLoading(false)
      setErro(err instanceof Error ? err.message : 'Erro desconhecido')
    }
  }

  const resetForm = () => {
    setFiles([])
    setPerfil('')
    setResultado(null)
    setErro(null)
    setLoading(false)
    setStepIdx(-1)
    setProgress(0)
    if (inputRef.current) inputRef.current.value = ''
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const perfilSelecionado = PERFIS.find(p => p.id === perfil)

  return (
    <>
      <div className="topbar">
        <h2>NOVA ANÁLISE</h2>
        <span className="status-pill">
          <i className="ti ti-cpu" aria-hidden="true" /> IA Ativa
        </span>
      </div>

      <div className="page">

        {/* Passo 1 — Perfil */}
        <div className="card">
          <div className="card-title">
            <i className="ti ti-user-check" aria-hidden="true" /> Passo 1 — Perfil da CNH do Condutor
          </div>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>
            Selecione o tipo de habilitação para calcular corretamente o risco de suspensão ou cassação.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {PERFIS.map(p => (
              <button
                key={p.id}
                onClick={() => setPerfil(p.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 16px', borderRadius: 10,
                  border: `2px solid ${perfil === p.id ? p.cor : 'var(--border)'}`,
                  background: perfil === p.id ? `${p.cor}15` : 'var(--card)',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                }}
              >
                <i className={`ti ${p.icon}`} style={{ fontSize: 24, color: p.cor, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
                    {p.label} — {p.sub}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{p.alerta}</div>
                </div>
                {perfil === p.id && (
                  <i className="ti ti-circle-check" style={{ color: p.cor, fontSize: 20, flexShrink: 0 }} />
                )}
              </button>
            ))}
          </div>

          {perfilSelecionado && (
            <div style={{
              marginTop: 12, padding: '10px 14px', borderRadius: 8,
              background: `${perfilSelecionado.cor}10`,
              border: `1px solid ${perfilSelecionado.cor}40`,
              fontSize: 12, color: 'var(--text)',
            }}>
              <strong>Perfil selecionado:</strong>{' '}
              {perfil === 'ppd' && 'Cassação imediata com 1 grave/gravíssima ou 2 médias. Prazo de 2 anos reinicia do zero.'}
              {perfil === 'definitiva' && 'Limite de 20, 30 ou 40 pts conforme infrações nos últimos 12 meses.'}
              {perfil === 'ear' && 'Limite fixo de 40 pontos em qualquer situação. Suspensão impacta diretamente o sustento profissional.'}
            </div>
          )}
        </div>

        {/* Passo 2 — Upload múltiplo */}
        <div className="card">
          <div className="card-title">
            <i className="ti ti-upload" aria-hidden="true" /> Passo 2 — Enviar Notificações
            {files.length > 0 && (
              <span style={{
                marginLeft: 8, background: 'var(--red)', color: '#fff',
                borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700,
              }}>
                {files.length} {files.length === 1 ? 'arquivo' : 'arquivos'}
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
            Envie <strong>todas as notificações do mesmo condutor</strong>. O sistema somará os pontos e analisará o risco consolidado.
          </p>

          <div
            className={`upload-zone${dragOver ? ' drag-over' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              multiple
              onChange={e => e.target.files && handleFiles(Array.from(e.target.files))}
            />
            <i className="ti ti-files upload-icon" aria-hidden="true" />
            <div className="upload-title">ARRASTE OU CLIQUE AQUI</div>
            <p className="upload-sub">Selecione uma ou mais notificações do mesmo condutor</p>
            <div className="format-badges">
              {['PDF','JPG','PNG','MÚLTIPLOS ARQUIVOS'].map(f => (
                <span key={f} className="fmt">{f}</span>
              ))}
            </div>
          </div>

          {/* Lista de arquivos */}
          {files.length > 0 && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {files.map((f, i) => (
                <div key={i} className="file-preview">
                  <i className="ti ti-file-check" style={{ fontSize: 20, color: 'var(--red)' }} />
                  <div className="file-preview-info">
                    <div className="file-preview-name">Notificação {i + 1} — {f.name}</div>
                    <div className="file-preview-size">
                      {(f.size / 1024).toFixed(0)} KB — {f.type.split('/')[1].toUpperCase()}
                    </div>
                  </div>
                  <button className="btn-remove" onClick={() => removeFile(i)} aria-label="Remover">
                    <i className="ti ti-x" />
                  </button>
                </div>
              ))}

              {/* Resumo de pontos estimado */}
              <div style={{
                padding: '10px 14px', borderRadius: 8,
                background: 'rgba(239,68,68,0.07)',
                border: '1px solid rgba(239,68,68,0.3)',
                fontSize: 12,
              }}>
                <i className="ti ti-alert-triangle" style={{ color: 'var(--red)', marginRight: 6 }} />
                <strong>{files.length} notificação(ões) carregada(s).</strong>{' '}
                A IA irá ler todas, somar a pontuação total e verificar se o condutor já estourou o limite do perfil selecionado.
              </div>
            </div>
          )}

          {!perfil && (
            <p style={{ fontSize: 12, color: '#f59e0b', marginTop: 10, textAlign: 'center' }}>
              ⚠ Selecione o perfil da CNH no Passo 1 antes de analisar
            </p>
          )}

          <button
            className="btn btn-primary btn-full"
            style={{ marginTop: 14 }}
            onClick={runAnalysis}
            disabled={files.length === 0 || !perfil || loading}
          >
            {loading
              ? <><span className="spinner" /> Analisando {files.length} notificação(ões)...</>
              : <><i className="ti ti-brain" aria-hidden="true" /> Analisar {files.length > 1 ? `${files.length} Notificações` : 'Notificação'} com IA</>
            }
          </button>
        </div>

        {loading && (
          <div className="progress-card">
            <div className="progress-label">
              <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>●</span>
              {STEPS[stepIdx] || 'Processando...'}
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="step-list">
              {STEPS.map((s, i) => (
                <div key={i} className={`step-item${i < stepIdx ? ' done' : i === stepIdx ? ' active' : ''}`}>
                  <i className={`ti ${i < stepIdx ? 'ti-circle-check' : i === stepIdx ? 'ti-loader' : 'ti-circle'}`} />
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}

        {erro && (
          <div className="card" style={{ marginTop: 14, textAlign: 'center', padding: 32 }}>
            <i className="ti ti-alert-circle" style={{ fontSize: 32, color: 'var(--red)', display: 'block', marginBottom: 10 }} />
            <p style={{ fontWeight: 600 }}>Erro ao processar os documentos</p>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>{erro}</p>
          </div>
        )}

        {resultado && (
          <div ref={resultRef}>
            <ResultadoCard resultado={resultado} onNova={resetForm} />
          </div>
        )}
      </div>
    </>
  )
}
