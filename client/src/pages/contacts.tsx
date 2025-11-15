import { InfoAlert } from "@/components/info-alert";

export default function Contacts() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Contatos</h2>
        <p className="text-muted-foreground">
          Gerencie seus contatos e conexões
        </p>
      </div>

      <InfoAlert
        title="Funcionalidade em Desenvolvimento"
        message="A página de contatos está sendo desenvolvida. Em breve você poderá adicionar e gerenciar seus contatos aqui."
      />
    </div>
  );
}
