import { z } from "zod"

export const stockEntrySchema = z.object({
  productId: z.string().trim().min(1, "Le produit est obligatoire"),
  quantity: z
    .number({ message: "La quantite est obligatoire" })
    .int("La quantite doit etre un entier")
    .min(1, "La quantite doit etre superieure a 0"),
  reason: z
    .string()
    .trim()
    .min(3, "Le motif doit contenir au moins 3 caracteres")
    .max(140, "Motif trop long"),
  reference: z.string().trim().max(40, "Reference trop longue").optional(),
})

export const stockExitSchema = z.object({
  productId: z.string().trim().min(1, "Le produit est obligatoire"),
  quantity: z
    .number({ message: "La quantite est obligatoire" })
    .int("La quantite doit etre un entier")
    .min(1, "La quantite doit etre superieure a 0"),
  reason: z
    .string()
    .trim()
    .min(3, "Le motif doit contenir au moins 3 caracteres")
    .max(140, "Motif trop long"),
  reference: z.string().trim().max(40, "Reference trop longue").optional(),
})

export type StockEntryFormValues = z.infer<typeof stockEntrySchema>
export type StockExitFormValues = z.infer<typeof stockExitSchema>
