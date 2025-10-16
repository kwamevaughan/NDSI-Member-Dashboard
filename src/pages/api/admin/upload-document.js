import { imagekit } from '@/utils/imageKitService';
import jwt from 'jsonwebtoken';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing Authorization header' });
    }
    const token = authHeader.replace('Bearer ', '');
    const adminUser = jwt.verify(token, process.env.JWT_SECRET);

    if (!adminUser || (adminUser.role !== 'admin' && adminUser.role !== 'super_admin')) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { fileBase64, fileName, folder, tags } = req.body || {};
    if (!fileBase64 || !fileName || !folder) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const isDataUrl = /^data:.+;base64,/.test(fileBase64);
    const uploadFile = isDataUrl ? fileBase64 : Buffer.from(fileBase64, 'base64');

    const now = Date.now();
    const safeFolder = folder.startsWith('/') ? folder : `/${folder}`;

    const response = await imagekit.upload({
      file: uploadFile,
      fileName: `${now}-${fileName}`,
      folder: safeFolder,
      useUniqueFileName: true,
      tags: Array.isArray(tags) ? tags : undefined,
    });

    return res.status(200).json({
      message: 'Upload successful',
      file: {
        id: response.fileId,
        name: response.name,
        url: response.url,
        filePath: response.filePath,
        size: response.size,
        type: response.fileType,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Failed to upload file', details: error.message });
  }
}


