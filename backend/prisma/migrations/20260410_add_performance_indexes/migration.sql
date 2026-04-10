-- AddIndex for User table
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_status_idx" ON "User"("status");
CREATE INDEX "User_roleId_idx" ON "User"("roleId");
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- AddIndex for Attendance table
CREATE INDEX "Attendance_userId_idx" ON "Attendance"("userId");
CREATE INDEX "Attendance_date_idx" ON "Attendance"("date");
CREATE INDEX "Attendance_userId_date_idx" ON "Attendance"("userId", "date");

-- AddIndex for Commande table
CREATE INDEX "Commande_clientId_idx" ON "Commande"("clientId");
CREATE INDEX "Commande_status_idx" ON "Commande"("status");
CREATE INDEX "Commande_createdAt_idx" ON "Commande"("createdAt");

-- AddIndex for Message table
CREATE INDEX "Message_fromId_idx" ON "Message"("fromId");
CREATE INDEX "Message_toId_idx" ON "Message"("toId");
CREATE INDEX "Message_status_idx" ON "Message"("status");

-- AddIndex for Notification table
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX "Notification_read_idx" ON "Notification"("read");
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");
