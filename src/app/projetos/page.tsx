'use client'

import { useEffect, useState } from 'react'
import type { Projeto } from '@/lib/types'
import ResultadoCard from '@/components/ResultadoCard'

export default function ProjetosPage() {
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [selecionado, setSelecionado] = useState<Projeto | null>(null)

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('mg_projetos') || '[]')
    setProjetos(stored)
  }, [])

  const urgentes = projetos.filter(p => p.risco_suspensao || p.risco_cassacao || p.dias_restantes <= 10)
  const receita = projetos.reduce((s, p) => s + (p.preco_recomendado || 600), 0)

  if (selecionado) {
    return (
      <>
        <div className="topbar">
          <h2>DETALHES DO CASO</h2>
          <button className="btn btn-outline" onClick={() => setSelecionado(null)}>
            <i className="ti ti-arrow-left" aria-hidden="true" /> Voltar
          </button>
        </div>
        <div className="page">
          <ResultadoCard resultado={selecionado.resultado} />
        </div>
      </>
    )
  }

  return (
    <>
      <div className="topbar">
        <h2>PROJETOS</h2>
        <span className="status-pill">
          <i className="ti ti-database" aria-hidden="true" /> {projetos.length} casos
        </span>
      </div>

      <div className="page">
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-n red">{urgentes.length}</div>
            <div className="stat-lbl">Urgentes</div>
          </div>
          <div className="stat-card">
            <div className="stat-n">{projetos.length}</div>
            <div className="stat-lbl">Total de Casos</div>
          </div>
          <div className="stat-card">
            <div className="stat-n green">R$ {receita.toLocaleString('pt-BR')}</div>
            <div className="stat-lbl">Receita Estimada</div>
          </div>
        </div>

        {projetos.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <i className="ti ti-folder-open" aria-hidden="true" />
              <p>Nenhum caso ainda.<br />Faça uma nova análise para começar.</p>
            </div>
          </div>
        ) : (
          projetos.map(p => {
            const isUrgente = p.risco_suspensao || p.risco_cassacao || p.dias_restantes <= 10
            return (
              <div key={p.id} className="proj-row" onClick={() => setSelecionado(p)}>
                <div className={`proj-icon ${isUrgente ? 'urgente' : 'andamento'}`}>
                  <i className={`ti ${isUrgente ? 'ti-alert-triangle' : 'ti-clock'}`} aria-hidden="true" />
                </div>
                <div className="proj-info">
                  <div className="proj-name">{p.descricao_infracao}</div>
                  <div className="proj-sub">
                    {p.orgao_autuador} — {p.artigo_ctb} — Prob. {p.probabilidade_exito}% —{' '}
                    R$ {p.preco_recomendado?.toLocaleString('pt-BR')}
                    {p.criadoEm && ` — ${new Date(p.criadoEm).toLocaleDateString('pt-BR')}`}
                  </div>
                </div>
                <span className={`proj-badge ${isUrgente ? 'urgente' : 'andamento'}`}>
                  {isUrgente ? 'Urgente' : 'Em andamento'}
                </span>
              </div>
            )
          })
        )}
      </div>
    </>
  )
}
