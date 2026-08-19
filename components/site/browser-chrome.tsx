interface BrowserChromeProps {
  url?: string
  label: string
  children: React.ReactNode
  className?: string
}

// Moldura de "print de produto" para os mockups da landing. O conteúdo
// interno recebe a classe .ui-preview (site.css), que reseta --radius
// para 6px — o mockup precisa parecer o produto real, não a landing.
export function BrowserChrome({ url = "aegis.app/chamados", label, children, className }: BrowserChromeProps) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-border bg-surface shadow-xl ${className ?? ""}`}
      role="img"
      aria-label={label}
    >
      <div className="flex items-center gap-2 border-b border-border bg-muted px-3 py-2">
        <span className="size-2.5 rounded-full bg-border" />
        <span className="size-2.5 rounded-full bg-border" />
        <span className="size-2.5 rounded-full bg-border" />
        <span className="ml-2 truncate rounded-md bg-background px-2 py-0.5 text-xs text-muted-foreground">
          {url}
        </span>
      </div>
      <div className="ui-preview overflow-x-auto bg-background p-3" aria-hidden="true">
        {children}
      </div>
    </div>
  )
}
