"use client";

import * as React from "react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Globe, Percent, QrCode } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateOrgSettings, updateQRSettings } from "@/lib/actions/organization";

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
  initialTaxRate: number;
  initialGcashQrUrl: string | null;
  initialMayaQrUrl: string | null;
}

export function OrganizationClient({
  initialCurrencyCode,
  initialTaxRate,
  initialGcashQrUrl,
  initialMayaQrUrl,
}: OrganizationClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isQrPending, startQrTransition] = useTransition();

  const [selectedCode, setSelectedCode] = React.useState(initialCurrencyCode);
  // Display as percentage string, e.g. 0.12 → "12"
  const [taxInput, setTaxInput] = React.useState(
    String(Math.round(initialTaxRate * 10000) / 100)
  );
  const [gcashQrUrl, setGcashQrUrl] = React.useState(initialGcashQrUrl ?? "");
  const [mayaQrUrl, setMayaQrUrl] = React.useState(initialMayaQrUrl ?? "");

  const selectedCurrency = CURRENCIES.find((c) => c.code === selectedCode) ?? CURRENCIES[0];

  const taxRateNum = parseFloat(taxInput);
  const taxRateValid = !isNaN(taxRateNum) && taxRateNum >= 0 && taxRateNum <= 100;

  const isDirty =
    selectedCode !== initialCurrencyCode ||
    taxRateNum !== Math.round(initialTaxRate * 10000) / 100;

  const isQrDirty =
    gcashQrUrl !== (initialGcashQrUrl ?? "") ||
    mayaQrUrl !== (initialMayaQrUrl ?? "");

  function handleSave() {
    if (!taxRateValid) {
      toast.error("Tax rate must be between 0 and 100");
      return;
    }
    startTransition(async () => {
      try {
        await updateOrgSettings({
          currency_code: selectedCurrency.code,
          currency_locale: selectedCurrency.locale,
          tax_rate: taxRateNum / 100, // store as decimal
        });
        toast.success("Organization settings saved");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save settings");
      }
    });
  }

  function handleQrSave() {
    startQrTransition(async () => {
      try {
        await updateQRSettings({
          gcash_qr_url: gcashQrUrl.trim() || null,
          maya_qr_url: mayaQrUrl.trim() || null,
        });
        toast.success("QR payment settings saved");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save QR settings");
      }
    });
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Organization Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure global settings that apply across all branches.
        </p>
      </div>

      {/* QR Payment Settings */}
      <Card>
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <QrCode className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">QR Payment Settings</CardTitle>
          </div>
          <CardDescription className="text-xs mt-1">
            Paste the URL of your GCash or Maya merchant QR image. Customers scan it during checkout.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5 space-y-5">
          {/* GCash */}
          <div className="space-y-2">
            <Label htmlFor="gcash-qr-url">GCash QR Image URL</Label>
            <Input
              id="gcash-qr-url"
              type="url"
              placeholder="https://..."
              value={gcashQrUrl}
              onChange={(e) => setGcashQrUrl(e.target.value)}
            />
            {gcashQrUrl.trim() && (
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Preview</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={gcashQrUrl.trim()}
                  alt="GCash QR"
                  className="h-40 w-40 rounded object-contain"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none" }}
                />
              </div>
            )}
          </div>

          {/* Maya */}
          <div className="space-y-2">
            <Label htmlFor="maya-qr-url">Maya QR Image URL</Label>
            <Input
              id="maya-qr-url"
              type="url"
              placeholder="https://..."
              value={mayaQrUrl}
              onChange={(e) => setMayaQrUrl(e.target.value)}
            />
            {mayaQrUrl.trim() && (
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Preview</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mayaQrUrl.trim()}
                  alt="Maya QR"
                  className="h-40 w-40 rounded object-contain"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none" }}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleQrSave} disabled={!isQrDirty || isQrPending}>
          {isQrPending ? "Saving…" : "Save QR Settings"}
        </Button>
      </div>

      {/* Currency */}
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
        </CardContent>
      </Card>

      {/* Tax Rate */}
      <Card>
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Tax Rate</CardTitle>
          </div>
          <CardDescription className="text-xs mt-1">
            Applied to all POS transactions. Set to 0 to disable tax.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="tax-rate">Tax Rate (%)</Label>
            <div className="flex items-center gap-2">
              <div className="relative w-36">
                <Input
                  id="tax-rate"
                  type="number"
                  min={0}
                  max={100}
                  step={0.01}
                  value={taxInput}
                  onChange={(e) => setTaxInput(e.target.value)}
                  className="pr-8"
                />
                <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-sm text-muted-foreground">
                  %
                </span>
              </div>
              {taxRateValid && (
                <span className="text-xs text-muted-foreground">
                  e.g. {new Intl.NumberFormat(selectedCurrency.locale, {
                    style: "currency",
                    currency: selectedCurrency.code,
                  }).format(100)} + {taxInput}% tax ={" "}
                  {new Intl.NumberFormat(selectedCurrency.locale, {
                    style: "currency",
                    currency: selectedCurrency.code,
                  }).format(100 * (1 + taxRateNum / 100))}
                </span>
              )}
            </div>
            {!taxRateValid && taxInput !== "" && (
              <p className="text-xs text-destructive">Enter a value between 0 and 100</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={!isDirty || !taxRateValid || isPending}>
          {isPending ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
