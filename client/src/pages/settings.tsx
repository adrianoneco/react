import { InfoAlert } from "@/components/info-alert";

export default function Settings() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Configurações</h2>
        <p className="text-muted-foreground">
          Personalize sua experiência no ChatApp
        </p>
      </div>

      <InfoAlert
        title="Funcionalidade em Desenvolvimento"
        message="A página de configurações está sendo desenvolvida. Em breve você poderá personalizar suas preferências e configurações de privacidade."
      />
    </div>
  );
}
