const path = require('path');
process.env.JWT_SECRET ||= require('node:crypto').randomBytes(48).toString('hex');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const config = require('../../config/env');
const ResourceController = require('../../controllers/resourceController');
const LessonController = require('../../controllers/lessonController');
const { secureUploadsMiddleware } = require('../../middlewares/secureUploadsMiddleware');
jest.mock('../../middlewares/authMiddleware', () => ({ verifySession: jest.fn() }));
const { verifySession } = require('../../middlewares/authMiddleware');

jest.mock('../../models', () => ({
  Resource: {
    findOne: jest.fn(),
  },
  Repository: {
    findOne: jest.fn(),
  },
  Lesson: {
    findOne: jest.fn(),
  },
  LessonProgress: {
    findOne: jest.fn(),
  },
  StudySetting: {
    findByPk: jest.fn(),
  },
}));

const { Resource, Repository, Lesson, LessonProgress } = require('../../models');

describe('JUA-01 / JUA-02: Protección de Recursos Privados y Control de Acceso', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      params: { id: 10 },
      user: { id: 2, rol: 'estudiante' },
      path: '/resources/pdfs/test_privado.pdf',
      url: '/uploads/resources/pdfs/test_privado.pdf',
      headers: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
      sendFile: jest.fn(),
    };

    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('TC-JUA-01: Control de descargas en repositorio privado por API', () => {
    test('Deniega descarga con 403 a estudiante ajeno en repositorio privado', async () => {
      Resource.findOne.mockResolvedValue({
        id_recurso: 10,
        titulo: 'Parcial Resuelto Privado',
        url_archivo: '/uploads/resources/pdfs/parcial.pdf',
        extension: '.pdf',
        increment: jest.fn(),
        repositorio: {
          id_repositorio: 1,
          id_profesor: 99, // Profesor dueño es 99, estudiante es 2
          publico: false, // Repositorio privado
          increment: jest.fn(),
        },
      });

      await ResourceController.download(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('No tienes permisos'),
        })
      );
    });

    test('Deniega streaming con 403 a estudiante ajeno en repositorio privado', async () => {
      Resource.findOne.mockResolvedValue({
        id_recurso: 10,
        titulo: 'Parcial Resuelto Privado',
        url_archivo: '/uploads/resources/pdfs/parcial.pdf',
        extension: '.pdf',
        repositorio: {
          id_repositorio: 1,
          id_profesor: 99,
          publico: false,
        },
      });

      await ResourceController.streamFile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('No tienes permisos'),
        })
      );
    });

    test('Permite descarga al docente propietario en repositorio privado', async () => {
      req.user = { id: 99, rol: 'docente' }; // Docente propietario

      const mockResource = {
        id_recurso: 10,
        titulo: 'Examen Docente',
        url_archivo: '/uploads/resources/pdfs/examen.pdf',
        extension: '.pdf',
        increment: jest.fn().mockResolvedValue(true),
        repositorio: {
          id_repositorio: 1,
          id_profesor: 99,
          publico: false,
          increment: jest.fn().mockResolvedValue(true),
        },
      };

      Resource.findOne.mockResolvedValue(mockResource);
      jest.spyOn(ResourceController, '_getLocalFilePath').mockReturnValue('/tmp/fake-path.pdf');
      jest.spyOn(fs.promises, 'access').mockResolvedValue(true);

      await ResourceController.download(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          type: 'file',
          downloadUrl: expect.stringMatching(/^\/content\/resources\/10\/file\?access_token=.+/),
          expiresAt: expect.any(String),
        })
      );
    });
  });

  describe('TC-JUA-01: Enlaces temporales firmados', () => {
    test('acepta un enlace vigente y conserva identidad del usuario', () => {
      const token = ResourceController._signTemporaryAccess(10, 99, 'docente', Date.now() + 60_000);
      req.query = { access_token: token };
      req.user = { id: '99', rol: 'docente' };

      ResourceController.temporaryAccess(req, res, next);

      expect(req.user).toEqual({ id: '99', rol: 'docente' });
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    test('rechaza un enlace vencido o ligado a otro recurso', () => {
      const expired = ResourceController._signTemporaryAccess(10, 99, 'docente', Date.now() - 1);
      req.query = { access_token: expired };
      ResourceController.temporaryAccess(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);

      jest.clearAllMocks();
      const wrongResource = ResourceController._signTemporaryAccess(11, 99, 'docente', Date.now() + 60_000);
      req.query = { access_token: wrongResource };
      ResourceController.temporaryAccess(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('TC-JUA-02: Protección contra descarga directa por URL en /uploads', () => {
    test('Deniega acceso anónimo sin token a archivo de recurso privado con 401', async () => {
      // Simular que el archivo existe físicamente
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);

      req.path = '/resources/pdfs/secreto.pdf';
      req.headers = {}; // Sin token

      Resource.findOne.mockResolvedValue({
        id_recurso: 20,
        url_archivo: '/uploads/resources/pdfs/secreto.pdf',
        repositorio: {
          id_repositorio: 2,
          id_profesor: 50,
          publico: false, // Privado
        },
      });

      await secureUploadsMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Autenticación requerida'),
        })
      );
    });

    test('Deniega acceso a estudiante ajeno con token a recurso privado con 403', async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);

      const secret = config.JWT_SECRET || 'jwt_secret_default_key_pae';
      const studentToken = jwt.sign({ id: 5, rol: 'estudiante' }, secret);
      verifySession.mockResolvedValue({ id: 5, rol: 'estudiante' });
      req.path = '/resources/pdfs/secreto.pdf';
      req.headers = { authorization: `Bearer ${studentToken}` };

      Resource.findOne.mockResolvedValue({
        id_recurso: 20,
        url_archivo: '/uploads/resources/pdfs/secreto.pdf',
        repositorio: {
          id_repositorio: 2,
          id_profesor: 50, // Docente dueño es 50
          publico: false,
        },
      });

      await secureUploadsMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('No tienes permisos'),
        })
      );
    });

    test('Bloquea intentos de Path Traversal con 403', async () => {
      req.path = '/../../etc/passwd';

      await secureUploadsMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('ruta inválida'),
        })
      );
    });
  });

  describe('TC-M2-S01: Validación de finalización de lección para descargar material', () => {
    test('Deniega descarga con 403 si el estudiante no completó la lección (AC-M2-S01-02)', async () => {
      Lesson.findOne.mockResolvedValue({
        id_leccion: 1,
        titulo: 'Álgebra Semana 1',
        contenido: 'Texto de la lección',
        publicado: true,
      });

      // Progreso no completado
      LessonProgress.findOne.mockResolvedValue(null);

      await LessonController.downloadMaterial(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Debes completar la leccion'),
        })
      );
    });
  });
});
