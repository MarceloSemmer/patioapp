"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { updateCompanySettings } from "@/server/actions/company-actions";

interface CompanySettingsFormProps {
  company: {
    id: string;
    name: string;
    ownersModuleEnabled: boolean;
    contractNumberPrefix: string;
    proposalNumberPrefix: string;
    ticketNumberPrefix: string;
    contractAlertDays: number[];
  };
}

export function CompanySettingsForm({ company }: CompanySettingsFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [contractNumberPrefix, setContractNumberPrefix] = useState(company.contractNumberPrefix);
  const [proposalNumberPrefix, setProposalNumberPrefix] = useState(company.proposalNumberPrefix);
  const [ticketNumberPrefix, setTicketNumberPrefix] = useState(company.ticketNumberPrefix);
  const [alertDays, setAlertDays] = useState(company.contractAlertDays.join(", "));
  const [ownersModuleEnabled, setOwnersModuleEnabled] = useState(company.ownersModuleEnabled);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateCompanySettings({
        companyId: company.id,
        contractNumberPrefix,
        proposalNumberPrefix,
        ticketNumberPrefix,
        contractAlertDays: alertDays
          .split(",")
          .map((d) => Number(d.trim()))
          .filter((d) => !Number.isNaN(d)),
        ownersModuleEnabled,
      });
      toast.success("Configurações atualizadas.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{company.name}</CardTitle>
        <CardDescription>Numeração automática, alertas e módulos.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor={`ct-${company.id}`}>Prefixo de contratos</Label>
              <Input id={`ct-${company.id}`} value={contractNumberPrefix} onChange={(e) => setContractNumberPrefix(e.target.value)} />
            </div>
            <div>
              <Label htmlFor={`pr-${company.id}`}>Prefixo de propostas</Label>
              <Input id={`pr-${company.id}`} value={proposalNumberPrefix} onChange={(e) => setProposalNumberPrefix(e.target.value)} />
            </div>
            <div>
              <Label htmlFor={`ch-${company.id}`}>Prefixo de chamados</Label>
              <Input id={`ch-${company.id}`} value={ticketNumberPrefix} onChange={(e) => setTicketNumberPrefix(e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor={`alert-${company.id}`}>Dias de alerta de vencimento de contrato</Label>
            <Input id={`alert-${company.id}`} value={alertDays} onChange={(e) => setAlertDays(e.target.value)} placeholder="180, 120, 90, 60, 30" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={ownersModuleEnabled} onCheckedChange={setOwnersModuleEnabled} />
            Módulo de proprietários habilitado
          </label>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
