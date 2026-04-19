import Signature, { type SignatureRef } from "@uiw/react-signature";
import { EraserIcon, PenIcon } from "lucide-react";
import type { CSSProperties } from "react";
import { useRef, useState } from "react";
import { Button } from "~/components/ui/button";

type AccessLogSignatureProps = {
  onSignatureChange?: (hasSignature: boolean) => void;
  onSignaturePayloadChange?: (payload: string) => void;
};

export default function AccessLogSignature({
  onSignatureChange,
  onSignaturePayloadChange,
}: AccessLogSignatureProps) {
  const signatureRef = useRef<SignatureRef>(null);
  const [strokes, setStrokes] = useState<number[][][]>([]);

  function handleClear() {
    signatureRef.current?.clear();
    setStrokes([]);
    onSignatureChange?.(false);
    onSignaturePayloadChange?.("");
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border bg-muted/30 p-3">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <PenIcon className="size-4" />
            Firma del visitante
          </div>
          <Button type="button" size="sm" variant="outline" onClick={handleClear}>
            <EraserIcon className="size-4" />
            Limpiar
          </Button>
        </div>
        <Signature
          ref={signatureRef}
          className="h-56 w-full touch-none rounded-lg border bg-white"
          options={{ size: 4, thinning: 0.6, smoothing: 0.5, streamline: 0.5 }}
          style={{ "--w-signature-background": "#ffffff" } as CSSProperties}
          onPointer={(points) => {
            if (points.length === 0) {
              return;
            }

            setStrokes((currentStrokes) => {
              const nextStrokes = [...currentStrokes, points];

              onSignaturePayloadChange?.(JSON.stringify({ strokes: nextStrokes }));

              return nextStrokes;
            });
            onSignatureChange?.(true);
          }}
        />
      </div>
      <p className="text-sm text-muted-foreground">
        Solicita al visitante que firme antes de confirmar el registro.
      </p>
    </div>
  );
}
