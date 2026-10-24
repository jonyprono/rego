import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, phone, password, role, department } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: 'User with this email already exists' });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        password: hashedPassword,
        role: role || 'TECHNICIAN',
        department: department || null,
      },
    });

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error: any) {
    console.error('===== REGISTER ERROR =====');
    console.error('Type:', error?.constructor?.name);
    console.error('Message:', error?.message);
    console.error('Code:', error?.code);
    console.error('==========================');
    res.status(500).json({ message: 'Server error during registration', debug: error?.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Check user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    // Generate token with role and department
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, department: user.department },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        department: user.department,
      },
    });
  } catch (error: any) {
    // ===== DEBUG DÉTAILLÉ =====
    console.error('===== LOGIN ERROR =====');
    console.error('Type:', error?.constructor?.name);
    console.error('Message:', error?.message);
    console.error('Code:', error?.code);
    console.error('Meta:', JSON.stringify(error?.meta));
    console.error('Stack:', error?.stack);
    console.error('DATABASE_URL définie:', !!process.env.DATABASE_URL);
    console.error('JWT_SECRET définie:', !!process.env.JWT_SECRET);
    console.error('=======================');

    // Identifier la cause spécifique
    let debugMessage = 'Server error during login';
    if (!process.env.DATABASE_URL) {
      debugMessage = '[DEBUG] DATABASE_URL manquante sur le serveur';
    } else if (error?.code === 'P1001' || error?.message?.includes('connect')) {
      debugMessage = '[DEBUG] Impossible de se connecter à la base de données';
    } else if (error?.code === 'P1002') {
      debugMessage = '[DEBUG] Timeout de connexion à la base de données';
    } else if (error?.code === 'P2021') {
      debugMessage = '[DEBUG] Table introuvable - migrations manquantes ?';
    } else if (error?.message?.includes('SSL')) {
      debugMessage = '[DEBUG] Erreur SSL avec la base de données';
    }

    res.status(500).json({
      message: debugMessage, // Send the actual debug message to the frontend
      debug: {               // Always send debug info so the user can see what's wrong
        error: error?.message,
        code: error?.code,
        dbConnected: !!process.env.DATABASE_URL
      }
    });
  }
};
