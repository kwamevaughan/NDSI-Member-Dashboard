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

    const { fileId } = req.body || {};
    if (!fileId) return res.status(400).json({ error: 'fileId is required' });

    await imagekit.deleteFile(fileId);
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('files-delete error:', e);
    return res.status(500).json({ error: 'Failed to delete file', details: e.message });
  }
}


