-- AlterTable
ALTER TABLE "candidates" ADD COLUMN     "availability" TEXT,
ADD COLUMN     "availableWeekends" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "blackoutDates" TEXT,
ADD COLUMN     "currentCtc" TEXT,
ADD COLUMN     "customSkills" JSONB,
ADD COLUMN     "expectedCtc" TEXT,
ADD COLUMN     "githubUrl" TEXT,
ADD COLUMN     "headline" TEXT,
ADD COLUMN     "linkedinUrl" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "noticePeriod" TEXT,
ADD COLUMN     "otherOffers" JSONB,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "preferredDays" TEXT,
ADD COLUMN     "preferredTimeSlot" TEXT,
ADD COLUMN     "workMode" TEXT;

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
