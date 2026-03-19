/**
 * Supprime tous les comptes étudiants de la base de données.
 * Ne touche pas les professeurs ni l'admin.
 * Les cours, paiements, messages et disponibilités liés aux étudiants sont supprimés (cascade).
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.user.count({ where: { role: 'STUDENT' } });
  console.log(`Suppression de ${count} compte(s) étudiant(s)...`);

  const result = await prisma.user.deleteMany({
    where: { role: 'STUDENT' },
  });

  console.log(`✓ ${result.count} compte(s) étudiant(s) supprimé(s).`);
}

main()
  .catch((e) => {
    console.error('Erreur:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
