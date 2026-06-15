export type UserRole = 'gestor' | 'participante'

export type TreinamentoStatus = 'agendado' | 'em_andamento' | 'concluido' | 'cancelado'
export type TreinamentoTipo   = 'novo_cliente' | 'revalidacao'

export interface Profile {
  id: string
  nome: string
  email: string
  role: UserRole
  cliente_id: string | null
  created_at: string
}

export interface Cliente {
  id: string
  nome: string
  tipo: string          // Factoring, FIDC, ESC, Securitizadora…
  contato_nome: string
  contato_email: string
  created_at: string
}

export interface Treinamento {
  id: string
  cliente_id: string
  modulo: string
  tipo: TreinamentoTipo
  status: TreinamentoStatus
  data_inicio: string
  data_fim: string | null
  carga_horaria: number
  instrutor: string
  link_teams: string | null
  conteudo: string[]         // lista de tópicos abordados
  materiais: Material[]
  chamados_count: number     // para revalidação
  created_at: string
  cliente?: Cliente
}

export interface Material {
  nome: string
  tipo: 'manual' | 'slides' | 'gravacao' | 'outro'
  url: string
}

export interface Sessao {
  id: string
  treinamento_id: string
  inicio: string    // "09:00"
  fim: string       // "12:00"
  descricao: string
  created_at: string
}

export interface Participante {
  id: string
  treinamento_id: string
  profile_id: string
  created_at: string
  profile?: Profile
}

export interface Avaliacao {
  id: string
  treinamento_id: string
  participante_id: string
  nota: number              // 1–5
  expectativa: string
  didatica: string
  duvidas_restantes: string
  comentario: string | null
  created_at: string
}

// Supabase Database shape (usado pelo client tipado)
export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Omit<Profile,'created_at'>; Update: Partial<Profile> }
      clientes: { Row: Cliente; Insert: Omit<Cliente,'id'|'created_at'>; Update: Partial<Cliente> }
      treinamentos: { Row: Treinamento; Insert: Omit<Treinamento,'id'|'created_at'>; Update: Partial<Treinamento> }
      sessoes: { Row: Sessao; Insert: Omit<Sessao,'id'|'created_at'>; Update: Partial<Sessao> }
      participantes: { Row: Participante; Insert: Omit<Participante,'id'|'created_at'>; Update: Partial<Participante> }
      avaliacoes: { Row: Avaliacao; Insert: Omit<Avaliacao,'id'|'created_at'>; Update: Partial<Avaliacao> }
    }
  }
}
