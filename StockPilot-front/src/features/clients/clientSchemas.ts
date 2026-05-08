import { z } from "zod"

export const clientFormSchema = z.object({
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caracteres")
    .max(80, "Le nom est trop long"),
  phone: z
    .string()
    .regex(/^[+]?[0-9]{8,15}$/, "Numero de telephone invalide"),
  email: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((value) => value === "" || z.string().email().safeParse(value).success, {
      message: "Adresse email invalide",
    }),
  address: z.string().max(140, "Adresse trop longue").optional().or(z.literal("")),
  status: z.enum(["active", "blocked"]),
})

export type ClientFormValues = z.infer<typeof clientFormSchema>
