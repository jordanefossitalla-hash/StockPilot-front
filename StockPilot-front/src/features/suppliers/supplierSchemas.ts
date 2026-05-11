import { z } from "zod"

export const supplierFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Le nom doit contenir au moins 2 caracteres")
    .max(100, "Le nom est trop long"),
  phone: z
    .string()
    .trim()
    .regex(/^[+]?[0-9]{8,15}$/, "Numero de telephone invalide"),
  email: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((value) => value === "" || z.string().email().safeParse(value).success, {
      message: "Adresse email invalide",
    }),
  address: z.string().max(180, "Adresse trop longue").optional().or(z.literal("")),
  status: z.enum(["active", "inactive"]),
  initialBalance: z
    .number({ message: "Le solde initial est obligatoire" })
    .finite("Le solde initial est invalide")
    .min(-1_000_000_000, "Solde initial trop faible")
    .max(1_000_000_000, "Solde initial trop eleve"),
})

export type SupplierFormValues = z.infer<typeof supplierFormSchema>
