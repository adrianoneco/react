import { Router, Request, Response } from 'express';
import { upload } from '../upload';

export function registerUploadRoutes(router: Router) {
  router.post('/api/upload', upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autenticado' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'Nenhum arquivo enviado' });
      }

      const fileUrl = `/${req.file.path}`;
      
      return res.status(200).json({
        url: fileUrl,
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      });
    } catch (error) {
      console.error('Erro no upload:', error);
      return res.status(500).json({ message: 'Erro ao fazer upload do arquivo' });
    }
  });
}
