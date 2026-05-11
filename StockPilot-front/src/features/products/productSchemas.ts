import { z } from "zod"

export const productFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Le nom doit contenir au moins 2 caracteres")
      .max(90, "Le nom est trop long"),
    category: z.enum([
      "informatique",
      "electromenager",
      "accessoire",
      "consommable",
    ]),
    purchasePrice: z
      .number({ message: "Le prix achat est obligatoire" })
      .min(1, "Le prix achat doit etre superieur a 0"),
    salePrice: z
      .number({ message: "Le prix vente est obligatoire" })
      .min(1, "Le prix vente doit etre superieur a 0"),
    quantity: z
      .number({ message: "La quantite est obligatoire" })
      .int("La quantite doit etre un entier")
      .min(0, "La quantite ne peut pas etre negative"),
  })
  .refine((value) => value.salePrice >= value.purchasePrice, {
    path: ["salePrice"],
    message: "Le prix vente doit etre superieur ou egal au prix achat",
  })

export type ProductFormValues = z.infer<typeof productFormSchema>
