const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const request = require("supertest");

const fixture = (fileName) => path.join(__dirname, "fixtures", fileName);

function crearAppDePruebaCP02() {
  const app = express();
  const upload = multer({ storage: multer.memoryStorage() });

  app.use(express.json());

  const recursos = [];

  // Simulación del docente propietario sin token
  app.use((req, res, next) => {
    req.user = {
      id: "docente01",
      email: "docente01@pae.edu",
      role: "docente"
    };
    next();
  });

  function validarNombre(nombre) {
    if (!nombre || !nombre.trim()) {
      return "El nombre del recurso es obligatorio";
    }
    return null;
  }

  function validarFormatoPDF(file) {
    const extension = path.extname(file.originalname).toLowerCase();

    if (extension !== ".pdf" || file.mimetype !== "application/pdf") {
      return "Solo se permiten archivos en formato PDF";
    }

    return null;
  }

  function validarIntegridadPDF(file) {
    const encabezado = file.buffer.subarray(0, 5).toString("ascii");

    if (encabezado !== "%PDF-") {
      return "El archivo PDF está dañado o no es válido";
    }

    return null;
  }

  app.post("/api/repositorio/:repoId/recursos", upload.single("archivo"), (req, res) => {
    const { nombre } = req.body;
    const archivo = req.file;

    const errorNombre = validarNombre(nombre);
    if (errorNombre) {
      return res.status(422).json({ message: errorNombre });
    }

    if (!archivo) {
      return res.status(422).json({ message: "El archivo es obligatorio" });
    }

    const errorFormato = validarFormatoPDF(archivo);
    if (errorFormato) {
      return res.status(422).json({ message: errorFormato });
    }

    const errorIntegridad = validarIntegridadPDF(archivo);
    if (errorIntegridad) {
      return res.status(422).json({ message: errorIntegridad });
    }

    const recurso = {
      id: `recurso-${recursos.length + 1}`,
      repoId: req.params.repoId,
      nombre,
      archivoOriginal: archivo.originalname,
      fechaCarga: new Date().toISOString(),
      propietario: req.user.email,
      opciones: ["editar", "eliminar", "reemplazar"]
    };

    recursos.push(recurso);

    return res.status(201).json({
      message: "Recurso cargado exitosamente",
      recurso
    });
  });

  app.get("/api/repositorio/:repoId/recursos", (req, res) => {
    const recursosDelRepo = recursos.filter(
      (recurso) => recurso.repoId === req.params.repoId
    );

    return res.status(200).json({
      recursos: recursosDelRepo
    });
  });

  return app;
}

describe("CP-02: Subida de Recursos PDF", () => {
  let app;
  const repoId = "calculo-diferencial-2026";

  beforeEach(() => {
    app = crearAppDePruebaCP02();
  });

  test("CA-01: PDF válido se sube correctamente", async () => {
    const res = await request(app)
      .post(`/api/repositorio/${repoId}/recursos`)
      .attach("archivo", fixture("tema1_valido.pdf"))
      .field("nombre", "Tema 1 - Límites y Continuidad");

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Recurso cargado exitosamente");
    expect(res.body.recurso).toHaveProperty("nombre");
    expect(res.body.recurso).toHaveProperty("fechaCarga");
    expect(res.body.recurso.nombre).toBe("Tema 1 - Límites y Continuidad");
  });

  test("CA-03: El recurso muestra opciones Editar / Eliminar / Reemplazar", async () => {
    await request(app)
      .post(`/api/repositorio/${repoId}/recursos`)
      .attach("archivo", fixture("tema1_valido.pdf"))
      .field("nombre", "Tema 1 - Límites y Continuidad");

    const res = await request(app)
      .get(`/api/repositorio/${repoId}/recursos`);

    expect(res.status).toBe(200);
    expect(res.body.recursos[0]).toHaveProperty("nombre");
    expect(res.body.recursos[0]).toHaveProperty("fechaCarga");
    expect(res.body.recursos[0].opciones).toEqual(
      expect.arrayContaining(["editar", "eliminar", "reemplazar"])
    );
  });

  test("CA-02: DOCX es rechazado por formato inválido", async () => {
    const res = await request(app)
      .post(`/api/repositorio/${repoId}/recursos`)
      .attach("archivo", fixture("apuntes.docx"))
      .field("nombre", "Apuntes");

    expect(res.status).toBe(422);
    expect(res.body.message).toBe("Solo se permiten archivos en formato PDF");
  });

  test("CA-02: PNG es rechazado por formato inválido", async () => {
    const res = await request(app)
      .post(`/api/repositorio/${repoId}/recursos`)
      .attach("archivo", fixture("imagen.png"))
      .field("nombre", "Imagen");

    expect(res.status).toBe(422);
    expect(res.body.message).toBe("Solo se permiten archivos en formato PDF");
  });

  test("CA-02: PDF corrupto es rechazado por integridad fallida", async () => {
    const res = await request(app)
      .post(`/api/repositorio/${repoId}/recursos`)
      .attach("archivo", fixture("corrupto.pdf"))
      .field("nombre", "PDF corrupto");

    expect(res.status).toBe(422);
    expect(res.body.message).toBe("El archivo PDF está dañado o no es válido");
  });

  test("CA-02: Nombre vacío con PDF válido es rechazado", async () => {
    const res = await request(app)
      .post(`/api/repositorio/${repoId}/recursos`)
      .attach("archivo", fixture("tema1_valido.pdf"))
      .field("nombre", "");

    expect(res.status).toBe(422);
    expect(res.body.message).toBe("El nombre del recurso es obligatorio");
  });

  test("Postcondición: solo queda registrado el PDF válido", async () => {
    await request(app)
      .post(`/api/repositorio/${repoId}/recursos`)
      .attach("archivo", fixture("tema1_valido.pdf"))
      .field("nombre", "Tema 1 - Límites y Continuidad");

    await request(app)
      .post(`/api/repositorio/${repoId}/recursos`)
      .attach("archivo", fixture("apuntes.docx"))
      .field("nombre", "Apuntes");

    await request(app)
      .post(`/api/repositorio/${repoId}/recursos`)
      .attach("archivo", fixture("imagen.png"))
      .field("nombre", "Imagen");

    await request(app)
      .post(`/api/repositorio/${repoId}/recursos`)
      .attach("archivo", fixture("corrupto.pdf"))
      .field("nombre", "PDF corrupto");

    const res = await request(app)
      .get(`/api/repositorio/${repoId}/recursos`);

    expect(res.status).toBe(200);
    expect(res.body.recursos).toHaveLength(1);
    expect(res.body.recursos[0].nombre).toBe("Tema 1 - Límites y Continuidad");
  });
});