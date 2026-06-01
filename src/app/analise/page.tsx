'use client'

import { useState, useRef, useCallback } from 'react'
import type { ResultadoAnalise } from '@/lib/types'
import ResultadoCard from '@/components/ResultadoCard'

const STEPS = [
  'Lendo e decodificando o documento...',
  'Extraindo dados da notificação...',
  'Identificando artigos do CTB aplicáveis...',
  'Calculando pontos e risco de suspensão...',
  'Analisando probabilidade de êxito recursal...',
  'Gerando argumentos de venda personalizados...',
  'Calculando penalidades e benefícios...',
  'Finalizando dossiê completo...',
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
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [stepIdx, setStepIdx] = useState(-1)
  const [resultado, setResultado] = useState<ResultadoAnalise | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  const handleFile = useCallback((f: File) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowed.includes(f.type)) { alert('Formato não suportado. Use PDF, JPG ou PNG.'); return }
    if (f.size > 20 * 1024 * 1024) { alert('Arquivo muito grande. Máximo 20MB.'); return }
    setFile(f)
    setResultado(null)
    setErro(null)
  }, [])

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0])
  }

  const removeFile = () => {
    setFile(null)
    setResultado(null)
    setErro(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const runAnalysis = async () => {
    if (!file || !perfil) return
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
      } else {
        clearInterval(timer)
      }
    }, 500)

    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('perfil', perfil)

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
          descricao_infracao: dados.extraido?.descricao_infracao || 'Infração',
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
    removeFile()
    setPerfil('')
    setResultado(null)
    setErro(null)
    setLoading(false)
    setStepIdx(-1)
    setProgress(0)
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

        {/* Step 1 — Perfil do condutor */}
        <div className="card">
          <div className="card-title">
            <i className="ti ti-user-check" aria-hidden="true" /> Passo 1 — Perfil da CNH do Condutor
          </div>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>
            Selecione o tipo de habilitação para calcular o risco real de suspensão ou cassação.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {PERFIS.map(p => (
              <button
                key={p.id}
                onClick={() => setPerfil(p.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 16px',
                  borderRadius: 10,
                  border: `2px solid ${perfil === p.id ? p.cor : 'var(--border)'}`,
                  background: perfil === p.id ? `${p.cor}15` : 'var(--card)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                }}
              >
                <i className={`ti ${p.icon}`} style={{ fontSize: 24, color: p.cor, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
                    {p.label} — {p.sub}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                    {p.alerta}
                  </div>
                </div>
                {perfil === p.id && (
                  <i className="ti ti-circle-check" style={{ color: p.cor, fontSize: 20, flexShrink: 0 }} />
                )}
              </button>
            ))}
          </div>

          {perfilSelecionado && (
            <div style={{
              marginTop: 12,
              padding: '10px 14px',
              borderRadius: 8,
              background: `${perfilSelecionado.cor}10`,
              border: `1px solid ${perfilSelecionado.cor}40`,
              fontSize: 12,
              color: 'var(--text)',
            }}>
              <strong>Perfil selecionado:</strong> {perfilSelecionado.label} ({perfilSelecionado.sub}) —{' '}
              {perfil === 'ppd' && 'Cassação imediata com 1 grave/gravíssima ou 2 médias. Prazo de 2 anos reinicia do zero.'}
              {perfil === 'definitiva' && 'Limite de 20, 30 ou 40 pts conforme infrações nos últimos 12 meses.'}
              {perfil === 'ear' && 'Limite fixo de 40 pontos em qualquer situação. Suspensão impacta diretamente o sustento profissional.'}
            </div>
          )}
        </div>

        {/* Step 2 — Upload */}
        <div className="card">
          <div className="card-title">
            <i className="ti ti-upload" aria-hidden="true" /> Passo 2 — Enviar Notificação de Infração
          </div>

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
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <i className="ti ti-file-text upload-icon" aria-hidden="true" />
            <div className="upload-title">ARRASTE OU CLIQUE AQUI</div>
            <p className="upload-sub">Envie a notificação de autuação ou penalidade do cliente</p>
            <div className="format-badges">
              {['PDF','JPG','PNG','FOTO DO DOCUMENTO'].map(f => (
                <span key={f} className="fmt">{f}</span>
              ))}
            </div>
          </div>

          {file && (
            <div className="file-preview">
              <i className="ti ti-file-check" style={{ fontSize: 20, color: 'var(--red)' }} aria-hidden="true" />
              <div className="file-preview-info">
                <div className="file-preview-name">{file.name}</div>
                <div className="file-preview-size">
                  {(file.size / 1024).toFixed(0)} KB — {file.type.split('/')[1].toUpperCase()}
                </div>
              </div>
              <button className="btn-remove" onClick={removeFile} aria-label="Remover arquivo">
                <i className="ti ti-x" aria-hidden="true" />
              </button>
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
            disabled={!file || !perfil || loading}
          >
            {loading
              ? <><span className="spinner" /> Analisando...</>
              : <><i className="ti ti-brain" aria-hidden="true" /> Analisar Notificação com IA</>
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
                <div
                  key={i}
                  className={`step-item${i < stepIdx ? ' done' : i === stepIdx ? ' active' : ''}`}
                >
                  <i className={`ti ${i < stepIdx ? 'ti-circle-check' : i === stepIdx ? 'ti-loader' : 'ti-circle'}`} aria-hidden="true" />
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}

        {erro && (
          <div className="card" style={{ marginTop: 14, textAlign: 'center', padding: 32 }}>
            <i className="ti ti-alert-circle" style={{ fontSize: 32, color: 'var(--red)', display: 'block', marginBottom: 10 }} aria-hidden="true" />
            <p style={{ fontWeight: 600 }}>Erro ao processar o documento</p>
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
