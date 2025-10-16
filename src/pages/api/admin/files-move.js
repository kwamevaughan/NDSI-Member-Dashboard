import { imagekit } from '@/utils/imageKitService';
import jwt from 'jsonwebtoken';

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

    const { sourceFilePath, destinationPath } = req.body || {};
    if (!sourceFilePath || !destinationPath) {
      return res.status(400).json({ error: 'sourceFilePath and destinationPath are required' });
    }

    const result = await new Promise((resolve, reject) => {
      imagekit.moveFile({ sourceFilePath, destinationPath }, (err, data) => {
        if (err) return reject(err);
        resolve(data);
      });
    });

    return res.status(200).json({ ok: true, result });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to move file', details: e.message });
  }
}


