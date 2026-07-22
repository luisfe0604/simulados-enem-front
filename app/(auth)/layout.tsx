import Logo from "@/components/Logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col lg:flex-row">
      {/* Painel de marca — signature. Gradiente azul→sky, mensagem pro estudante.
          Vira um cabeçalho compacto no mobile. */}
      <aside className="brand-gradient relative flex flex-col justify-between overflow-hidden px-6 py-8 text-white lg:w-[45%] lg:px-12 lg:py-14">
        <div className="flex items-center gap-2">
          <Logo variant="mark" size={32} />
          <span className="font-display text-lg font-semibold">NexAprova</span>
        </div>

        <div className="hidden lg:block">
          <h2 className="font-display text-4xl font-bold leading-tight tracking-tight">
            Sua aprovação
            <br />
            começa com
            <br />
            uma questão.
          </h2>
          <p className="mt-4 max-w-sm text-white/80">
            Simulados do ENEM ilimitados, correção na hora e histórico do seu
            progresso — tudo em um só lugar.
          </p>
        </div>

        {/* Marca d'água numérica gigante — remete à nota do ENEM (0–1000). */}
        <div
          aria-hidden
          className="watermark-number absolute -bottom-10 -right-6 text-[10rem] text-white/10 lg:text-[14rem]"
        >
          1000
        </div>
      </aside>

      {/* Formulário */}
      <main className="flex flex-1 items-center justify-center bg-bg-page px-4 py-10">
        <div className="glow rise-in w-full max-w-md rounded-2xl border border-border-soft bg-bg-card p-8 shadow-strong">
          {children}
        </div>
      </main>
    </div>
  );
}
