import { Router } from 'express';
import prisma from '../lib/db.js';

const router = Router();

// POST /api/reservation – public, enregistre une demande de réservation
router.post('/reservation', async (req, res) => {
  const { firstName, lastName, email, phoneCountry, phoneNumber, age, pack } = req.body;
  if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) {
    return res.status(400).json({ error: 'Prénom, nom et email requis' });
  }
  const country = String(phoneCountry || 'FR').trim().slice(0, 10);
  const number = String(phoneNumber || '').trim().replace(/\D/g, '').slice(0, 20);
  if (!number) return res.status(400).json({ error: 'Numéro de téléphone requis' });

  const reservation = await prisma.reservation.create({
    data: {
      firstName: firstName.trim().slice(0, 100),
      lastName: lastName.trim().slice(0, 100),
      email: email.trim().slice(0, 255),
      phoneCountry: country,
      phoneNumber: number,
      age: age != null && String(age).trim() ? String(age).trim().slice(0, 20) : null,
      pack: pack != null && String(pack).trim() ? String(pack).trim().slice(0, 50) : null,
    },
  });
  res.status(201).json(reservation);
});

export default router;
