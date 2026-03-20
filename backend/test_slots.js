import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const MOROCCO_TZ = 'Africa/Casablanca';

const toMoroccoParts = (dayOfWeek, timeStr) => {
  const d = 4 + Number(dayOfWeek);
  const refDate = `2026-01-${String(d).padStart(2, '0')}`;
  const utcDate = new Date(`${refDate}T${timeStr.length === 5 ? timeStr + ':00' : timeStr}Z`);
  if (isNaN(utcDate.getTime())) return null;

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: MOROCCO_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  });
  const map = {};
  for (const part of formatter.formatToParts(utcDate)) {
    if (part.type !== 'literal') map[part.type] = part.value;
  }
  const jsDow = new Date(Date.UTC(Number(map.year), Number(map.month) - 1, Number(map.day))).getUTCDay();
  return {
    day: jsDow === 0 ? 7 : jsDow,
    time: `${String(map.hour).padStart(2, '0')}:${String(map.minute).padStart(2, '0')}`
  };
};

const mapSlots = (slotsArray) => {
  const result = [];
  (slotsArray || []).forEach((s) => {
    const startParts = toMoroccoParts(s.dayOfWeek, s.startTime);
    const endParts = toMoroccoParts(s.dayOfWeek, s.endTime || s.startTime);
    
    if (!startParts || !endParts) {
      result.push(s);
      return;
    }

    if (startParts.day !== endParts.day) {
      result.push({ ...s, dayOfWeek: startParts.day, startTime: startParts.time, endTime: '24:00' });
      result.push({ ...s, dayOfWeek: endParts.day, startTime: '00:00', endTime: endParts.time });
    } else {
      result.push({ ...s, dayOfWeek: startParts.day, startTime: startParts.time, endTime: endParts.time });
    }
  });
  return result;
};

async function run() {
  const studentsData = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    select: {
      id: true,
      name: true,
      studentAvailability: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] },
    },
  });
  
  for (const s of studentsData) {
    if (s.studentAvailability.length > 0) {
      console.log('Student:', s.name);
      console.log('Raw UTC DB slots:', s.studentAvailability.map(x => `${x.dayOfWeek} ${x.startTime}-${x.endTime}`));
      console.log('Mapped to Morocco:', mapSlots(s.studentAvailability).map(x => `${x.dayOfWeek} ${x.startTime}-${x.endTime}`));
    }
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
