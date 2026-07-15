import type { DocumentStatus, DocumentType, Prisma } from "../../../prisma/generated/prisma/client";
import { prisma } from "../prisma.server";

export type WorkerDocumentListItem = Prisma.WorkerDocumentGetPayload<Record<string, never>>;

export type WorkerDocumentWithWorker = Prisma.WorkerDocumentGetPayload<{
  include: {
    externalWorker: {
      select: {
        id: true;
        firstName: true;
        lastName: true;
        legalId: true;
        company: { select: { id: true; name: true } };
      };
    };
  };
}>;

export type CreateWorkerDocumentInput = {
  documentType: DocumentType;
  status: DocumentStatus;
  fileName: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  expiryDate: Date;
  notes?: string;
  externalWorkerId: string;
};

export type UpdateWorkerDocumentInput = {
  status?: DocumentStatus;
  expiryDate?: Date;
  notes?: string;
  filePath?: string;
};

export class WorkerDocumentEntity {
  public static async create(data: CreateWorkerDocumentInput) {
    return prisma.workerDocument.create({
      data: {
        documentType: data.documentType,
        status: data.status,
        fileName: data.fileName,
        filePath: data.filePath,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        expiryDate: data.expiryDate,
        notes: data.notes,
        externalWorkerId: data.externalWorkerId,
      },
    });
  }

  public static async findByWorkerId(workerId: string) {
    return prisma.workerDocument.findMany({
      where: { externalWorkerId: workerId },
      orderBy: { createdAt: "desc" },
    });
  }

  public static async findById(id: string) {
    return prisma.workerDocument.findUnique({
      where: { id },
      include: {
        externalWorker: {
          select: { id: true, firstName: true, lastName: true, legalId: true },
        },
      },
    });
  }

  public static async update(id: string, data: UpdateWorkerDocumentInput) {
    return prisma.workerDocument.update({
      where: { id },
      data: {
        status: data.status,
        expiryDate: data.expiryDate,
        notes: data.notes,
        filePath: data.filePath,
      },
    });
  }

  public static async delete(id: string) {
    return prisma.workerDocument.delete({
      where: { id },
    });
  }

  public static async findExpiredValidated() {
    return prisma.workerDocument.findMany({
      where: {
        status: "VALIDATED",
        expiryDate: { lt: new Date() },
      },
    });
  }

  public static async markManyAsExpired(ids: string[]) {
    return prisma.workerDocument.updateMany({
      where: { id: { in: ids } },
      data: { status: "EXPIRED" },
    });
  }

  public static async findValidByWorkerIdAndType(
    workerId: string,
    documentType: DocumentType,
  ) {
    return prisma.workerDocument.findFirst({
      where: {
        externalWorkerId: workerId,
        documentType,
        status: "VALIDATED",
        expiryDate: { gte: new Date() },
      },
      orderBy: { expiryDate: "desc" },
    });
  }

  public static async findAllWithWorker(): Promise<WorkerDocumentWithWorker[]> {
    return prisma.workerDocument.findMany({
      include: {
        externalWorker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            legalId: true,
            company: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
