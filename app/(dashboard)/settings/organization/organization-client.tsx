"use client";

import * as React from "react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateOrgSettings } from "@/lib/actions/organization";

const CURRENCIES = [
  { code: "USD", locale: "en-US",  label: "USD — US Dollar ($)" },
  { code: "EUR", locale: "de-DE",  label: "EUR — Euro (€)" },
  { code: "GBP", locale: "en-GB",  label: "GBP — British Pound (£)" },
  { code: "PHP", locale: "en-PH",  label: "PHP — Philippine Peso (₱)" },
  { code: "JPY", locale: "ja-JP",  label: "JPY — Japanese Yen (¥)" },
  { code: "CAD", locale: "en-CA",  label: "CAD — Canadian Dollar (CA$)" },
  { code: "AUD", locale: "en-AU",  label: "AUD — Australian Dollar (A$)" },
  { code: "INR", locale: "en-IN",  label: "INR — Indian Rupee (₹)" },
  { code: "SGD", locale: "en-SG",  label: "SGD — Singapore Dollar (S$)" },
  { code: "MYR", locale: "ms-MY",  label: "MYR — Malaysian Ringgit (RM)" },
  { code: "THB", locale: "th-TH",  label: "THB — Thai Baht (฿)" },
  { code: "IDR", locale: "id-ID",  label: "IDR — Indonesian Rupiah (Rp)" },
  { code: "KRW", locale: "ko-KR",  label: "KRW — Korean Won (₩)" },
  { code: "CNY", locale: "zh-CN",  label: "CNY — Chinese Yuan (¥)" },
  { code: "BRL", locale: "pt-BR",  label: "BRL — Brazilian Real (R$)" },
  { code: "MXN", locale: "es-MX",  label: "MXN — Mexican Peso (MX$)" },
  { code: "AED", locale: "ar-AE",  label: "AED — UAE Dirham (د.إ)" },
  { code: "SAR", locale: "ar-SA",  label: "SAR — Saudi Riyal (﷼)" },
  { code: "ZAR", locale: "en-ZA",  label: "ZAR — South African Rand (R)" },
  { code: "VND", locale: "vi-VN",  label: "VND — Vietnamese Dong (₫)" },
] as const;

interface OrganizationClientProps {
  initialCurrencyCode: string;
}

export function OrganizationClient({ initialCurrencyCode }: OrganizationClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [selectedCode, setSelectedCode] = React.useState(initialCurrencyCode);

  const selectedCurrency = CURRENCIES.find((c) => c.code === selectedCode) ?? CURRENCIES[0];

  function handleSave() {
    startTransition(async () => {
      try {
        await updateOrgSettings({
          currency_code: selectedCurrency.code,
          currency_locale: selectedCurrency.locale,
        });
        toast.success("Currency settings saved");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save settings");
      }
    });
  }

  const isDirty = selectedCode !== initialCurrencyCode;

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Organization Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure global settings that apply across all branches.
        </p>
      </div>

      <Card>
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Currency</CardTitle>
          </div>
          <CardDescription className="text-xs mt-1">
            All prices and amounts will be displayed in this currency.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="currency-select">Display Currency</Label>
            <Select value={selectedCode} onValueChange={(v) => { if (v) setSelectedCode(v) }}>
              <SelectTrigger id="currency-select" className="w-72">
                <SelectValue placeholder="Select currency">
                  {selectedCurrency.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Preview</p>
            <p className="text-sm text-foreground tabular-nums">
              {new Intl.NumberFormat(selectedCurrency.locale, {
                style: "currency",
                currency: selectedCurrency.code,
              }).format(1234.56)}
            </p>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={!isDirty || isPending}>
              {isPending ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
