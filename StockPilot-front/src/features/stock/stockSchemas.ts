import { z } from "zod"

export const stockEntrySchema = z.object({
  productId: z.string().trim().min(1, "Le produit est obligatoire"),
  quantity: z
    .number({ message: "La quantite est obligatoire" })
    .int("La quantite doit etre un entier")
    .min(1, "La quantite doit etre superieure a 0"),
  unitCost: z
    .number({ message: "Le cout unitaire est obligatoire" })
    .min(1, "Le cout unitaire doit etre superieur a 0"),
  reference: z.string().trim().max(40, "Reference trop longue").optional(),
  note: z.string().trim().max(200, "Note trop longue").optional(),
})

export const stockExitSchema = z.object({
  productId: z.string().trim().min(1, "Le produit est obligatoire"),
  quantity: z
    .number({ message: "La quantite est obligatoire" })
    .int("La quantite doit etre un entier")
    .min(1, "La quantite doit etre superieure a 0"),
  reference: z.string().trim().max(40, "Reference trop longue").optional(),
  note: z.string().trim().max(200, "Note trop longue").optional(),
})

export type StockEntryFormValues = z.infer<typeof stockEntrySchema>
export type StockExitFormValues = z.infer<typeof stockExitSchema>
