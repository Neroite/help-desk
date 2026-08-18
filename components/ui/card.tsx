import { cn } from "@/lib/utils"

// Borda unificada dos "cards" do help desk — antes cada tela repetia
// `border border-border` à mão; centralizado aqui pra corrigir contraste
// (ver --border em globals.css) num só lugar.
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn("rounded-lg border border-border bg-card text-card-foreground shadow-sm", className)}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-header" className={cn("flex flex-col gap-1 p-(--card-pad)", className)} {...props} />
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("p-(--card-pad) pt-0", className)} {...props} />
}

export { Card, CardHeader, CardContent }
