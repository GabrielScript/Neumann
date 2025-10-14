import { z } from 'zod';

// Challenge validation schemas
export const challengeSchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'Nome do desafio é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  description: z.string()
    .max(1000, 'Descrição deve ter no máximo 1000 caracteres')
    .optional(),
  duration_days: z.number()
    .int('Duração deve ser um número inteiro')
    .min(1, 'Duração deve ser pelo menos 1 dia')
    .max(365, 'Duração não pode exceder 365 dias'),
  difficulty: z.number()
    .int('Dificuldade deve ser um número inteiro')
    .min(1, 'Dificuldade mínima é 1')
    .max(5, 'Dificuldade máxima é 5')
    .optional(),
});

export const habitSchema = z.object({
  title: z.string()
    .trim()
    .min(1, 'Título do hábito é obrigatório')
    .max(100, 'Título deve ter no máximo 100 caracteres'),
  description: z.string()
    .trim()
    .min(1, 'Descrição é obrigatória')
    .max(500, 'Descrição deve ter no máximo 500 caracteres'),
  priority: z.enum(['imprescindivel', 'importante', 'acessorio']),
  facilitators: z.string()
    .max(500, 'Facilitadores devem ter no máximo 500 caracteres')
    .optional(),
  reminder_time: z.string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Horário inválido (use formato HH:MM)')
    .optional(),
  happiness_level: z.number()
    .int('Nível de felicidade deve ser um número inteiro')
    .min(1, 'Nível mínimo é 1')
    .max(10, 'Nível máximo é 10')
    .optional(),
});

export const challengeItemSchema = z.object({
  title: z.string()
    .trim()
    .min(1, 'Título é obrigatório')
    .max(100, 'Título deve ter no máximo 100 caracteres'),
  description: z.string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .optional()
    .nullable(),
  facilitators: z.string()
    .max(500, 'Facilitadores devem ter no máximo 500 caracteres')
    .optional()
    .nullable(),
});

// Life goals validation schemas
export const lifeGoalSchema = z.object({
  title: z.string()
    .trim()
    .min(1, 'Título do objetivo é obrigatório')
    .max(100, 'Título deve ter no máximo 100 caracteres'),
  deadline: z.string().optional(),
  happiness_level: z.number()
    .int('Nível de felicidade deve ser um número inteiro')
    .min(1, 'Nível mínimo é 1')
    .max(10, 'Nível máximo é 10'),
  motivation: z.string()
    .trim()
    .min(1, 'Motivação é obrigatória')
    .max(2000, 'Motivação deve ter no máximo 2000 caracteres'),
  action_plan: z.string()
    .trim()
    .min(1, 'Plano de ação é obrigatório')
    .max(2000, 'Plano de ação deve ter no máximo 2000 caracteres'),
});

// Authentication validation schemas
export const signUpSchema = z.object({
  email: z.string()
    .trim()
    .min(1, 'Email é obrigatório')
    .email('Email inválido')
    .max(255, 'Email deve ter no máximo 255 caracteres'),
  password: z.string()
    .min(9, 'Senha deve ter pelo menos 9 caracteres')
    .max(72, 'Senha deve ter no máximo 72 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número')
    .regex(/[^A-Za-z0-9]/, 'Senha deve conter pelo menos um caractere especial (!@#$%^&*, etc.)'),
  fullName: z.string()
    .trim()
    .min(1, 'Nome completo é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras'),
});

export const signInSchema = z.object({
  email: z.string()
    .trim()
    .min(1, 'Email é obrigatório')
    .email('Email inválido')
    .max(255, 'Email deve ter no máximo 255 caracteres'),
  password: z.string()
    .min(1, 'Senha é obrigatória'),
});

export const resetPasswordSchema = z.object({
  password: z.string()
    .min(9, 'Senha deve ter pelo menos 9 caracteres')
    .max(72, 'Senha deve ter no máximo 72 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número')
    .regex(/[^A-Za-z0-9]/, 'Senha deve conter pelo menos um caractere especial (!@#$%^&*, etc.)'),
  confirmPassword: z.string()
    .min(1, 'Confirmação de senha é obrigatória'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

export const forgotPasswordSchema = z.object({
  email: z.string()
    .trim()
    .min(1, 'Email é obrigatório')
    .email('Email inválido')
    .max(255, 'Email deve ter no máximo 255 caracteres'),
});

// Community validation schemas
export const communitySchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'Nome da comunidade é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  description: z.string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .optional(),
});

export const chatMessageSchema = z.object({
  message: z.string()
    .trim()
    .min(1, 'Mensagem não pode estar vazia')
    .max(1000, 'Mensagem deve ter no máximo 1000 caracteres'),
});

// Profile validation schema
export const profileSchema = z.object({
  full_name: z.string()
    .trim()
    .min(1, 'Nome completo é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras'),
});
