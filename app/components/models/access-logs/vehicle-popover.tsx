import { Button, buttonVariants } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "~/components/ui/popover";
import type { AccessLogVehicle } from "../../../../prisma/generated/prisma/client";
import { InfoIcon } from "lucide-react";
import FieldWrapper from "~/components/ui/wrappers/field-wrapper";
import { Input } from "~/components/ui/input";

interface VehiclePopoverProps {
  vehicleLog: AccessLogVehicle;
}

export default function VehiclePopover({ vehicleLog }: VehiclePopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <InfoIcon />
          {vehicleLog.plateSnapshot}
        </Button>
      </PopoverTrigger>
      <PopoverContent side="top" align="center">
        <PopoverTitle>Datos sobre el vehículo</PopoverTitle>
        <FieldWrapper label="Tipo" htmlFor="type" orientation="horizontal">
          <Input id="type" value={vehicleLog.typeSnapshot} readOnly />
        </FieldWrapper>
        <FieldWrapper label="Marca" htmlFor="brand" orientation="horizontal">
          <Input
            id="brand"
            value={vehicleLog.brandSnapshot ?? undefined}
            readOnly
          />
        </FieldWrapper>
        <FieldWrapper label="Modelo" htmlFor="model" orientation="horizontal">
          <Input
            id="model"
            value={vehicleLog.modelSnapshot ?? undefined}
            readOnly
          />
        </FieldWrapper>
      </PopoverContent>
    </Popover>
  );
}
