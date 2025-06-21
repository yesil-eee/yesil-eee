import { z } from "zod";

export const processRecordSchema = z.object({
  id: z.string(),
  date: z.string(),
  name: z.string().min(1, "Ad Soyad zorunludur"),
  productCode: z.string().min(1, "Ürün Kodu zorunludur"),
  operationType: z.string().min(1, "İşlem Türü zorunludur"),
  operationMeasure: z.string().min(1, "İşlem Ölçüsü zorunludur"),
  quantity: z.number().min(1, "Adet en az 1 olmalıdır"),
  description: z.string().optional(),
  createdAt: z.string(),
});

export const adminSettingsSchema = z.object({
  password: z.string().min(1, "Şifre zorunludur"),
  companyName: z.string().optional(),
  productCodes: z.array(z.string()),
  operationTypes: z.array(z.string()),
  operationMeasures: z.array(z.string()),
});

export const csvFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  month: z.string(),
  year: z.string(),
  data: z.array(processRecordSchema),
  createdAt: z.string(),
});

export type ProcessRecord = z.infer<typeof processRecordSchema>;
export type AdminSettings = z.infer<typeof adminSettingsSchema>;
export type CSVFile = z.infer<typeof csvFileSchema>;

export const insertProcessRecordSchema = processRecordSchema.omit({ id: true, createdAt: true });
export type InsertProcessRecord = z.infer<typeof insertProcessRecordSchema>;
