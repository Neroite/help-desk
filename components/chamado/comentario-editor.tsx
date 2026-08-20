"use client"

import { useRef } from "react"
import { Bold, ImagePlus, Italic, Link2, List, ListOrdered, Underline as UnderlineIcon } from "lucide-react"
import { EditorContent, useEditor, type JSONContent } from "@tiptap/react"
import Image from "@tiptap/extension-image"
import StarterKit from "@tiptap/starter-kit"
import { toast } from "sonner"

import { buttonVariants } from "@/components/ui/button"
import { anexarArquivo } from "@/lib/tickets/anexos"
import { cn } from "@/lib/utils"

interface ComentarioEditorProps {
  ticketNumero: number
  placeholder: string
  interno: boolean
  onChange: (documento: JSONContent, textoPlano: string) => void
}

// Editor rich text leve do modal de comentário (F5, decisão 5): negrito,
// itálico, sublinhado, listas, link e imagem -- nada além disso, StarterKit
// vem com heading/blockquote/codeBlock/regra horizontal desligados porque
// lib/comentario/render-html.ts não os mapeia (a marcação sobreviveria como
// texto solto, sem tag, o que é degradação aceitável mas não o objetivo).
// Renderizado só via next/dynamic ssr:false (C9) -- useEditor com
// immediatelyRender:false evita a hidratação divergente de servidor/cliente
// que este projeto já levou em dois outros lugares (ver comentário em
// chamado-detalhe-client.tsx e ticket-timeline.tsx).
export function ComentarioEditor({ ticketNumero, placeholder, interno, onChange }: ComentarioEditorProps) {
  const inputImagemRef = useRef<HTMLInputElement>(null)

  async function subirImagemInline(arquivo: File): Promise<string | null> {
    if (!arquivo.type.startsWith("image/")) {
      toast.error("Só é possível colar/inserir imagens no comentário.")
      return null
    }
    const formData = new FormData()
    formData.append("arquivo", arquivo)
    try {
      // inline: true (não entra na lista "Anexos" do chamado, já aparece
      // embutida no corpo) · revalidar: false (C4 -- revalidatePath aqui
      // dispararia router.refresh() no meio da digitação e derrubaria o
      // foco/estado do editor).
      const { id } = await anexarArquivo(formData, { ticketNumero, inline: true, revalidar: false })
      return `/api/anexos/${id}`
    } catch {
      toast.error("Não foi possível enviar a imagem.")
      return null
    }
  }

  // Ponto único pras 3 formas de inserir imagem (botão, colar, arrastar) --
  // sem isso o usuário clica/cola e, se demorar um instante pro upload
  // terminar, não tem nenhum sinal de que algo está acontecendo (o único
  // feedback antes disso era o toast de ERRO; sucesso era silencioso).
  async function inserirImagem(arquivo: File) {
    const src = await subirImagemInline(arquivo)
    if (!src) return
    editor?.chain().focus().setImage({ src }).run()
    toast.success("Imagem inserida.")
  }

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      // Tiptap v3: StarterKit já embute Link e Underline por padrão -- passar
      // as duas extensões separadas (como em v2) duplicava o nome da
      // extensão e disparava o warning "Duplicate extension names found".
      // Configurar direto pelas chaves link/underline do StarterKit.
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        link: { openOnClick: false, autolink: true },
      }),
      Image,
    ],
    editorProps: {
      attributes: {
        class: cn(
          "prose-comentario min-h-80 rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none",
          interno && "border-accent/50 bg-accent/5"
        ),
        "aria-label": placeholder,
      },
      handlePaste(_view, event) {
        const arquivos = Array.from(event.clipboardData?.items ?? [])
          .filter((item) => item.kind === "file")
          .map((item) => item.getAsFile())
          .filter((file): file is File => file !== null && file.type.startsWith("image/"))
        if (arquivos.length === 0) return false
        event.preventDefault()
        arquivos.forEach((arquivo) => void inserirImagem(arquivo))
        return true
      },
      handleDrop(_view, event) {
        const arquivos = Array.from(event.dataTransfer?.files ?? []).filter((file) =>
          file.type.startsWith("image/")
        )
        if (arquivos.length === 0) return false
        event.preventDefault()
        arquivos.forEach((arquivo) => void inserirImagem(arquivo))
        return true
      },
    },
    onUpdate({ editor: instancia }) {
      onChange(instancia.getJSON(), instancia.getText())
    },
  })

  function alternarLink() {
    if (!editor) return
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run()
      return
    }
    const url = window.prompt("URL do link:")
    if (!url) return
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }

  async function selecionarImagem(event: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0]
    event.target.value = ""
    if (!arquivo || !editor) return
    await inserirImagem(arquivo)
  }

  if (!editor) {
    return <div className="h-80 animate-pulse rounded-md border border-input bg-muted/40" />
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-0.5 rounded-md border border-input bg-surface p-1">
        <BotaoFormato
          rotulo="Negrito"
          ativo={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold aria-hidden="true" />
        </BotaoFormato>
        <BotaoFormato
          rotulo="Itálico"
          ativo={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic aria-hidden="true" />
        </BotaoFormato>
        <BotaoFormato
          rotulo="Sublinhado"
          ativo={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon aria-hidden="true" />
        </BotaoFormato>
        <BotaoFormato
          rotulo="Lista com marcadores"
          ativo={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List aria-hidden="true" />
        </BotaoFormato>
        <BotaoFormato
          rotulo="Lista numerada"
          ativo={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered aria-hidden="true" />
        </BotaoFormato>
        <BotaoFormato rotulo="Link" ativo={editor.isActive("link")} onClick={alternarLink}>
          <Link2 aria-hidden="true" />
        </BotaoFormato>
        <BotaoFormato rotulo="Inserir imagem" ativo={false} onClick={() => inputImagemRef.current?.click()}>
          <ImagePlus aria-hidden="true" />
        </BotaoFormato>
        <input
          ref={inputImagemRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          className="hidden"
          onChange={selecionarImagem}
        />
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}

function BotaoFormato({
  rotulo,
  ativo,
  onClick,
  children,
}: {
  rotulo: string
  ativo: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={rotulo}
      aria-pressed={ativo}
      title={rotulo}
      onClick={onClick}
      className={cn(
        buttonVariants({ variant: ativo ? "secondary" : "ghost", size: "icon-xs" }),
        "cursor-pointer"
      )}
    >
      {children}
    </button>
  )
}
