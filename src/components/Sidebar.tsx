'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: 'ti-layout-dashboard' },
  { href: '/analise', label: 'Nova Análise', icon: 'ti-file-upload' },
  { href: '/projetos', label: 'Projetos', icon: 'ti-briefcase' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="sidebar">
      <div className="logo-area">
        <h1>MG MULTAS</h1>
        <p>Soluções em Recursos</p>
      </div>
      <nav>
        {links.map(l => (
          <Link
            key={l.href}
            href={l.href}
            className={`nav-item${pathname.startsWith(l.href) ? ' active' : ''}`}
          >
            <i className={`ti ${l.icon}`} aria-hidden="true" />
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="sidebar-footer">
        <p>MG Multas 2.0<br />Sistema de Gestão</p>
      </div>
    </aside>
  )
}
