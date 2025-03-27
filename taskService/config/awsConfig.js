import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const clientParams = {
  region:"ap-south-1",
  credentials:{
    accessKeyId:process.env.S3_ACCESS_KEY_ID,
    secretAccessKey:process.env.S3_SECRET_ACCESS_KEY
  }
}
const s3Client = new S3Client(clientParams);

export const getObjectPresignedUrl = async (key) => {
  let updatedKey = key.split("upload/")[1]
  const command = new GetObjectCommand({
    Bucket:"vishwjeetdev",
    Key:`upload/${updatedKey}`
  })
  const url = await getSignedUrl(s3Client, command);
  return url;
}

export const putObjectPresignedUrl = async (fileName,fileType) => {
  const sanitizedFilename = fileName.replace(/\s+/g, "_");
  const command = new PutObjectCommand({
    Bucket:"vishwjeetdev",
    Key:`upload/tasks/${Date.now()}_${sanitizedFilename}`,
    ContentType:fileType
  })

  const url = await getSignedUrl(s3Client, command)
  return url;
}


