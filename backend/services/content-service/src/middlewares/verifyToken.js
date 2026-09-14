const authMiddleware = (req, res, next) => {
  if (process.env.NODE_ENV === "test") {
    req.user = {
      id: "docente01",
      email: "docente01@pae.edu",
      role: "docente"
    };
    return next();
  }

  // aquí queda tu validación real con JWT
};