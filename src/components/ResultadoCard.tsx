import type { ResultadoAnalise, ArgumentoVenda, Penalidade } from '@/lib/types'

const ARG_LABELS: Record<ArgumentoVenda['tipo'], string> = {
  perigo: '⚠ Risco Real',
  juridico: '⚖ Nossa Análise Técnica',
  urgencia: '⏰ Urgência',
  beneficio: '✓ Benefício ao Cliente',
}

const PEN_ICONS: Record<Penalidade['nivel'], string> = {
  critico: 'ti-skull',
  grave: 'ti-alert-triangle',
  moderado: 'ti-info-circle',
}

interface Props {
  resultado: ResultadoAnalise
  onNova?: () => void
}

export default function ResultadoCard({ resultado, onNova }: Props) {
  const e = resultado.extraido
  const a = resultado.analise
  const v = resultado.venda

  const nivelClass = { Alta: 'alta', Média: 'media', Baixa: 'baixa' }[a.nivel_chance] ?? 'media'
  const urgente = (e.dias_restantes ?? 30) <= 15

  return (
    <>
      {urgente && (
        <div className="alert-prazo" style={{ marginTop: 14 }}>
          <i className="ti ti-alarm" aria-hidden="true" />
          <div>
            <strong>PRAZO CRÍTICO:</strong> Restam aproximadamente{' '}
            <strong>{e.dias_restantes} dias</strong> para o recurso. Apresente esta análise ao cliente hoje.
          </div>
        </div>
      )}

      {/* Dados extraídos */}
      <div className="card" style={{ marginTop: 14 }}>
        <div className="card-title">
          <i className="ti ti-file-description" aria-hidden="true" /> Dados Extraídos da Notificação
        </div>
        <div className="info-grid">
          {[
            ['Número do Auto', e.numero_auto],
            ['Tipo de Documento', e.tipo_documento],
            ['Data da Infração', e.data_infracao],
            ['Órgão Autuador', e.orgao_autuador],
            ['Infração', e.descricao_infracao],
            ['Artigo CTB', e.artigo_ctb],
            ['Gravidade', e.gravidade, e.gravidade === 'Gravíssima' || e.gravidade === 'Grave' ? 'red' : 'amber'],
            ['Pontos a Acrescentar', `+${e.pontos_adicionar} pts`, 'red'],
            ['Valor da Multa', e.valor_multa, 'red'],
            [`Prazo — ${e.instancia_recurso}`, `${e.prazo_recurso}${urgente ? ' ⚠' : ''}`, urgente ? 'red' : 'amber'],
            ['Risco Suspensão', e.risco_suspensao ? 'Sim — ação urgente' : 'Não', e.risco_suspensao ? 'red' : 'green'],
            ['Risco Cassação', e.risco_cassacao ? 'Sim — crítico' : 'Não', e.risco_cassacao ? 'red' : 'green'],
          ].map(([lbl, val, cls]) => (
            <div key={lbl as string} className="info-cell">
              <div className="info-lbl">{lbl}</div>
              <div className={`info-val${cls ? ` ${cls}` : ''}`}>{val || '—'}</div>
            </div>
          ))}
        </div>

        <div className="divider" />

        {/* Sem % — apenas nível de probabilidade */}
        <div className={`verdict-hero ${nivelClass}`}>
          <div className="vh-eyebrow">Avaliação do caso</div>
          <div className="vh-title">{a.nivel_chance} Probabilidade de Êxito</div>
          <div className="vh-sub">{a.resumo_tecnico}</div>
        </div>
      </div>

      {/* Penalidades */}
      <div className="card">
        <div className="card-title">
          <i className="ti ti-skull" aria-hidden="true" /> O Que Acontece Se Não Recorrer
        </div>
        <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 10 }}>
          Mostre ao cliente o que está em jogo:
        </p>
        <div className="penalidade-grid">
          {v.penalidades_sem_recurso?.map((p, i) => (
            <div key={i} className={`pen-card ${p.nivel}`}>
              <i className={`ti ${PEN_ICONS[p.nivel]} pen-icon`} aria-hidden="true" />
              <div className="pen-lbl">{p.tipo}</div>
              <div className="pen-val">{p.valor}</div>
              <div className="pen-desc">{p.descricao}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Benefícios */}
      <div className="card">
        <div className="card-title">
          <i className="ti ti-shield-check" aria-hidden="true" /> Benefícios de Contratar a MG Multas
        </div>
        {v.beneficios_recurso?.map((b, i) => (
          <div key={i} className="beneficio-row">
            <i className="ti ti-circle-check" aria-hidden="true" />
            <span>{b}</span>
          </div>
        ))}
      </div>

      {/* Argumentos de venda */}
      <div className="card">
        <div className="card-title">
          <i className="ti ti-message-bolt" aria-hidden="true" /> Argumentos de Venda
        </div>
        <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 10 }}>
          Use estes argumentos na ordem ao falar com o cliente. Não entre no mérito jurídico.
        </p>
        {v.argumentos_venda?.map((ag, i) => (
          <div key={i} className={`arg-card ${ag.tipo}`}>
            <div className="arg-type">{ARG_LABELS[ag.tipo]}</div>
            <div className="arg-title">{ag.titulo}</div>
            <div className="arg-body">{ag.corpo}</div>
          </div>
        ))}
      </div>

      {/* Script */}
      <div className="card">
        <div className="card-title">
          <i className="ti ti-microphone" aria-hidden="true" /> Script de Abertura — Consultor
        </div>
        <div className="script-box">"{v.script_abertura}"</div>
        <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8, lineHeight: 1.5 }}>
          ⚠ Nunca prometa resultado garantido. Nunca explique como será feito o recurso.
          O mérito jurídico é exclusivo da nossa equipe especializada.
        </p>
      </div>

      {/* Precificação */}
      <div className="card">
        <div className="card-title">
          <i className="ti ti-currency-dollar" aria-hidden="true" /> Precificação Sugerida
        </div>
        <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>{v.justificativa_preco}</p>
        <div className="price-grid">
          <div className="price-card">
            <div className="price-lbl">Mínimo</div>
            <div className="price-val">R$ {v.preco_minimo?.toLocaleString('pt-BR')}</div>
            <div className="price-note">Recurso administrativo simples</div>
          </div>
          <div className="price-card rec">
            <div className="price-tag">IDEAL</div>
            <div className="price-lbl">Recomendado</div>
            <div className="price-val">R$ {v.preco_recomendado?.toLocaleString('pt-BR')}</div>
            <div className="price-note">Acompanhamento completo</div>
          </div>
          <div className="price-card">
            <div className="price-lbl">Teto</div>
            <div className="price-val">R$ {v.preco_maximo?.toLocaleString('pt-BR')}</div>
            <div className="price-note">Casos críticos com risco de suspensão/cassação</div>
          </div>
        </div>
        <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 10, lineHeight: 1.5 }}>
          Nunca ofereça devolução condicional por resultado. Venda o serviço, não o resultado.
        </p>
      </div>

      <div className="action-row">
        {onNova && (
          <button className="btn btn-primary" onClick={onNova}>
            <i className="ti ti-plus" aria-hidden="true" /> Nova Análise
          </button>
        )}
        <a href="/projetos" className="btn btn-outline">
          <i className="ti ti-briefcase" aria-hidden="true" /> Ver Projetos
        </a>
      </div>
    </>
  )
}
