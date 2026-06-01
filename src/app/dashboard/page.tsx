'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Projeto } from '@/lib/types'

export default function DashboardPage() {
  const [projetos, setProjetos] = useState<Projeto[]>([])

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('mg_projetos') || '[]')
    setProjetos(stored)
  }, [])

  const urgentes = projetos.filter(p => p.risco_suspensao || p.risco_cassacao || p.dias_restantes <= 10)
  const receita = projetos.reduce((s, p) => s + (p.preco_recomendado || 600), 0)
  const mediaProb = projetos.length
    ? Math.round(projetos.reduce((s, p) => s + (p.probabilidade_exito || 0), 0) / projetos.length)
    : 0

  return (
    <>
      <div className="topbar">
        <h2>DASHBOARD</h2>
        <span className="status-pill">
          <i className="ti ti-activity" aria-hidden="true" /> Operacional
        </span>
      </div>

      <div className="page">
        <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
          <div className="stat-card">
            <div className="stat-n red">{urgentes.length}</div>
            <div className="stat-lbl">Urgentes</div>
          </div>
          <div className="stat-card">
            <div className="stat-n">{projetos.length}</div>
            <div className="stat-lbl">Casos Analisados</div>
          </div>
          <div className="stat-card">
            <div className="stat-n green">R$ {receita.toLocaleString('pt-BR')}</div>
            <div className="stat-lbl">Receita Estimada</div>
          </div>
          <div className="stat-card">
            <div className="stat-n">{mediaProb}%</div>
            <div className="stat-lbl">Prob. Média de Êxito</div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">
            <i className="ti ti-rocket" aria-hidden="true" /> Fluxo Operacional
          </div>
          {[
            ['1', 'Cliente traz a notificação', 'Foto, PDF ou scan do auto de infração ou notificação de penalidade'],
            ['2', 'IA extrai todos os dados automaticamente', 'Número do auto, infração, artigo CTB, valor, prazo, pontos — sem digitar nada'],
            ['3', 'Dossiê completo de venda gerado', 'Penalidades, argumentos, script de abordagem e precificação com base na gravidade'],
            ['4', 'Consultor fecha o serviço', 'Usa o script e os argumentos para convencer o cliente. A franqueadora produz o recurso.'],
          ].map(([n, title, desc]) => (
            <div key={n} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 14 }}>
              <div style={{ width: 28, height: 28, background: 'var(--red)', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Bebas Neue",sans-serif', fontSize: 14, flexShrink: 0 }}>{n}</div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600 }}>{title}</p>
                <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-title">
            <i className="ti ti-target" aria-hidden="true" /> Metas da Rede MG Multas
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              ['55 vendas/mês', 'Meta de volume'],
              ['R$ 600', 'Ticket médio'],
              ['R$ 33.000', 'Faturamento mensal alvo'],
              ['15 dias', 'Antecedência p/ envio ao jurídico'],
            ].map(([val, lbl]) => (
              <div key={lbl} style={{ background: 'var(--surface)', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontFamily: '"Bebas Neue",sans-serif', fontSize: 22 }}>{val}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="action-row">
          <Link href="/analise" className="btn btn-primary">
            <i className="ti ti-file-upload" aria-hidden="true" /> Nova Análise
          </Link>
          <Link href="/projetos" className="btn btn-outline">
            <i className="ti ti-briefcase" aria-hidden="true" /> Ver Projetos
          </Link>
        </div>
      </div>
    </>
  )
}
