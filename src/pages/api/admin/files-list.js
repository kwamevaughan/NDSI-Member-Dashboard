import { imagekit } from '@/utils/imageKitService';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    // Aggressive no-cache to prevent stale 304s
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    res.setHeader('ETag', `${Date.now()}`);
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing Authorization header' });
    }
    const token = authHeader.replace('Bearer ', '');
    let adminUser;
    try {
      adminUser = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (!adminUser || (adminUser.role !== 'admin' && adminUser.role !== 'super_admin')) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { prefix = '/' } = req.query;
    const limit = 100;
    let skip = 0;
    let all = [];
    let more = true;
    while (more) {
      const files = await imagekit.listFiles({ limit, skip });
      const filtered = files.filter(f => f.type === 'file' && (
        (f.filePath && (f.filePath === prefix || f.filePath.startsWith(prefix + '/')))
        || (f.name && (f.name === prefix || f.name.startsWith(prefix + '/')))
      ));
      all = all.concat(filtered);
      more = files.length === limit;
      skip += limit;
    }
    return res.status(200).json({ files: all });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to list files', details: e.message });
  }
}


