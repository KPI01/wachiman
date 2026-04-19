import Signature, { type SignatureRef } from "@uiw/react-signature";
import { EraserIcon, PenIcon } from "lucide-react";
import type { CSSProperties } from "react";
import { useRef, useState } from "react";
import { Button } from "~/components/ui/button";

type AccessLogSignatureProps = {
  inputName: string;
  onSignatureChange?: (hasSignature: boolean) => void;
};

export default function AccessLogSignature({
  inputName,
  onSignatureChange,
}: AccessLogSignatureProps) {
  const signatureRef = useRef<SignatureRef>(null);
  const [strokes, setStrokes] = useState<number[][][]>([]);

  function handleClear() {
    signatureRef.current?.clear();
    setStrokes([]);
    onSignatureChange?.(false);
  }

  return (
    <div className="space-y-3">
      <input
        type="hidden"
        name={inputName}
        value={strokes.length ? JSON.stringify({ strokes }) : ""}
      />
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

            setStrokes((currentStrokes) => [...currentStrokes, points]);
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
