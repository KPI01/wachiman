export type WorkPermitRiskItem = {
  title: string;
  measures: string;
};

export const WORK_PERMIT_SIGNER_TYPES = {
  WORKER: "WORKER",
  APPROVER: "APPROVER",
} as const;

export const WORK_PERMIT_SIGNER_LABELS = {
  WORKER: "Trabajador",
  APPROVER: "Responsable de aprobación",
} as const;
