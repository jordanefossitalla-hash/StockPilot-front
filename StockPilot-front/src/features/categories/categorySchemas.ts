import { z } from "zod"

export const categoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Le nom doit contenir au moins 2 caracteres")
    .max(80, "Le nom est trop long"),
  description: z
    .string()
    .trim()
    .min(4, "La description doit contenir au moins 4 caracteres")
    .max(220, "Description trop longue"),
  status: z.enum(["active", "inactive"]),
})

export type CategoryFormValues = z.infer<typeof categoryFormSchema>
