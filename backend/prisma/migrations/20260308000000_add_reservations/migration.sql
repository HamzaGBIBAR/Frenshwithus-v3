-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneCountry" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "age" TEXT,
    "pack" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);
