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

export const createProductFormSchema = z
  .object({
    sku: z
      .string()
      .trim()
      .min(3, "Le SKU doit contenir au moins 3 caracteres")
      .max(40, "Le SKU est trop long"),
    name: z
      .string()
      .trim()
      .min(2, "Le nom doit contenir au moins 2 caracteres")
      .max(90, "Le nom est trop long"),
    categoryId: z.string().trim().min(1, "La categorie est obligatoire"),
    costPrice: z
      .number({ message: "Le prix achat est obligatoire" })
      .min(1, "Le prix achat doit etre superieur a 0"),
    salePrice: z
      .number({ message: "Le prix vente est obligatoire" })
      .min(1, "Le prix vente doit etre superieur a 0"),
    stockQuantity: z
      .number({ message: "Le stock initial est obligatoire" })
      .int("Le stock initial doit etre un entier")
      .min(0, "Le stock initial ne peut pas etre negatif"),
    stockMinThreshold: z
      .number({ message: "Le seuil minimum est obligatoire" })
      .int("Le seuil minimum doit etre un entier")
      .min(0, "Le seuil minimum ne peut pas etre negatif"),
    status: z.enum(["active", "inactive"]),
  })
  .refine((value) => value.salePrice >= value.costPrice, {
    path: ["salePrice"],
    message: "Le prix vente doit etre superieur ou egal au prix achat",
  })

export type CreateProductFormValues = z.infer<typeof createProductFormSchema>
