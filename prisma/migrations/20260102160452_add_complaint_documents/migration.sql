-- CreateTable
CREATE TABLE "complaint_documents" (
    "id" SERIAL NOT NULL,
    "complaint_id" INTEGER NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "complaint_documents_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "complaint_documents" ADD CONSTRAINT "complaint_documents_complaint_id_fkey" FOREIGN KEY ("complaint_id") REFERENCES "complaints"("id") ON DELETE CASCADE ON UPDATE CASCADE;
