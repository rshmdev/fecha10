import { ArrowLeft } from "@untitledui/icons";
import { useNavigate } from "react-router-dom";

function TermsPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-primary text-primary">
      <header className="fixed top-0 z-50 flex h-16 w-full items-center border-b border-secondary bg-primary px-4 shadow-sm">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 rounded-full p-2 text-fg-quaternary transition-colors hover:bg-primary_hover active:scale-95"
        >
          <ArrowLeft className="size-5" />
          <span className="font-display text-sm font-semibold">Voltar</span>
        </button>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-5 pb-12 pt-24">
        <h1 className="mb-6 font-display text-3xl font-bold text-primary">
          Termos de Uso
        </h1>

        <div className="prose prose-sm max-w-none text-secondary">
          <p className="text-sm text-tertiary">
            Última atualização: Abril de 2026
          </p>

          <section className="mt-8">
            <h2 className="mb-3 font-display text-xl font-bold text-primary">
              1. Sobre o Fecha10
            </h2>
            <p className="leading-relaxed">
              O Fecha10 é um aplicativo voltado para a organização e gestão de
              partidas de futebol amador (&quot;peladas&quot;). A plataforma
              permite que usuários criem jogos, convidem jogadores, gerem
              confirmações de presença, organizem times e acompanhem pagamentos.
            </p>
          </section>

          <section className="mt-6">
            <h2 className="mb-3 font-display text-xl font-bold text-primary">
              2. Cadastro e Acesso
            </h2>
            <p className="leading-relaxed">
              Para utilizar o Fecha10, o usuário deve se cadastrar utilizando
              seu número de telefone celular, que será verificado por meio de um
              código SMS. O usuário é responsável por manter a confidencialidade
              de seu acesso e por todas as atividades realizadas em sua conta.
            </p>
          </section>

          <section className="mt-6">
            <h2 className="mb-3 font-display text-xl font-bold text-primary">
              3. Uso da Plataforma
            </h2>
            <p className="leading-relaxed">
              O Fecha10 é uma ferramenta de organização. A plataforma não se
              responsabiliza pela realização das partidas, qualidade dos locais,
              ou qualquer interação entre os usuários. Os organizadores de cada
              pelada são responsáveis por suas respectivas partidas.
            </p>
            <p className="mt-3 leading-relaxed">
              É proibido utilizar a plataforma para:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Publicar conteúdo ofensivo, discriminatório ou ilegal</li>
              <li>Assediar ou ameaçar outros usuários</li>
              <li>Utilizar dados de outros usuários para fins não autorizados</li>
              <li>Violar qualquer lei ou regulamento aplicável</li>
            </ul>
          </section>

          <section className="mt-6">
            <h2 className="mb-3 font-display text-xl font-bold text-primary">
              4. Pagamentos
            </h2>
            <p className="leading-relaxed">
              O Fecha10 não processa pagamentos. O registro de pagamentos no
              aplicativo serve apenas como controle organizacional entre os
              participantes. Qualquer transação financeira é de responsabilidade
              exclusiva dos usuários envolvidos.
            </p>
          </section>

          <section className="mt-6">
            <h2 className="mb-3 font-display text-xl font-bold text-primary">
              5. Privacidade
            </h2>
            <p className="leading-relaxed">
              Coletamos apenas os dados necessários para o funcionamento do
              serviço: número de telefone, nome, idade e posições preferidas no
              futebol. Seus dados não são compartilhados com terceiros. Para mais
              detalhes, consulte nossa Política de Privacidade.
            </p>
          </section>

          <section className="mt-6">
            <h2 className="mb-3 font-display text-xl font-bold text-primary">
              6. Notificações
            </h2>
            <p className="leading-relaxed">
              O aplicativo envia notificações sobre eventos relevantes como
              confirmações de presença, alterações em peladas e lembretes. O
              usuário pode gerenciar as permissões de notificação nas
              configurações do dispositivo.
            </p>
          </section>

          <section className="mt-6">
            <h2 className="mb-3 font-display text-xl font-bold text-primary">
              7. Responsabilidade
            </h2>
            <p className="leading-relaxed">
              O Fecha10 não se responsabiliza por lesões, danos ou qualquer
              incidente ocorrido durante as partidas. Os usuários participam das
              peladas por sua própria conta e risco. Recomendamos a prática
              responsável do esporte.
            </p>
          </section>

          <section className="mt-6">
            <h2 className="mb-3 font-display text-xl font-bold text-primary">
              8. Alterações nos Termos
            </h2>
            <p className="leading-relaxed">
              Estes termos podem ser atualizados a qualquer momento. Os usuários
              serão notificados sobre alterações significativas através do
              aplicativo. O uso continuado da plataforma após as alterações
              constitui aceitação dos novos termos.
            </p>
          </section>

          <section className="mt-6">
            <h2 className="mb-3 font-display text-xl font-bold text-primary">
              9. Contato
            </h2>
            <p className="leading-relaxed">
              Para dúvidas ou questões sobre estes termos, entre em contato
              através do aplicativo.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

export default TermsPage;
