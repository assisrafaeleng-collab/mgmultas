export interface DadosExtraidos {
  numero_auto: string
  data_infracao: string
  orgao_autuador: string
  local_infracao: string
  codigo_infracao: string
  descricao_infracao: string
  gravidade: 'Leve' | 'Média' | 'Grave' | 'Gravíssima'
  pontos_adicionar: number
  valor_multa: string
  prazo_recurso: string
  dias_restantes: number
  tipo_documento: string
  artigo_ctb: string
  instancia_recurso: string
  indicacao_condutor_possivel: boolean
  risco_suspensao: boolean
  risco_cassacao: boolean
}

export interface Analise {
  probabilidade_exito: number
  nivel_chance: 'Alta' | 'Média' | 'Baixa'
  resumo_tecnico: string
  fundamentos_juridicos: string[]
  pontos_atacar: string[]
  estrategia_defesa: string
}

export interface Penalidade {
  tipo: string
  valor: string
  nivel: 'critico' | 'grave' | 'moderado'
  descricao: string
}

export interface ArgumentoVenda {
  tipo: 'perigo' | 'juridico' | 'urgencia' | 'beneficio'
  titulo: string
  corpo: string
}

export interface Venda {
  penalidades_sem_recurso: Penalidade[]
  beneficios_recurso: string[]
  argumentos_venda: ArgumentoVenda[]
  script_abertura: string
  preco_minimo: number
  preco_recomendado: number
  preco_maximo: number
  justificativa_preco: string
}

export interface ResultadoAnalise {
  extraido: DadosExtraidos
  analise: Analise
  venda: Venda
}

export interface Projeto {
  id: string
  criadoEm: string
  descricao_infracao: string
  orgao_autuador: string
  artigo_ctb: string
  gravidade: string
  probabilidade_exito: number
  preco_recomendado: number
  risco_suspensao: boolean
  risco_cassacao: boolean
  dias_restantes: number
  resultado: ResultadoAnalise
}
