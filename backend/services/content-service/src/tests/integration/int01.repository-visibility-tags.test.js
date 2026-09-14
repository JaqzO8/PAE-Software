describe('INT-01 - Repositorio, visibilidad y búsqueda por tags', () => {
  test('Crea repositorio con tags, aparece en explore y desaparece al privatizarlo', () => {
    const docenteId = 10;

    // BD simulada
    const repositorios = [];
    const tags = [];
    const repositorioTags = [];

    // 1. Crear repositorio con tags
    const repo = {
      id_repositorio: 1,
      id_profesor: docenteId,
      titulo: 'Álgebra Básica',
      descripcion: 'Guías de práctica',
      id_categoria: 1,
      publico: true,
      activo: true,
    };

    repositorios.push(repo);

    const tagsEntrada = ['algebra', 'guías'];

    tagsEntrada.forEach((tagName, index) => {
      const tag = {
        id_tag: index + 1,
        nombre: tagName,
        slug: tagName.toLowerCase().replace(/\s+/g, '-'),
      };

      tags.push(tag);

      repositorioTags.push({
        id_repositorio: repo.id_repositorio,
        id_tag: tag.id_tag,
      });
    });

    expect(repositorios).toHaveLength(1);
    expect(tags).toHaveLength(2);
    expect(repositorioTags).toHaveLength(2);

    // 2. Explore con tag algebra y publico=true
    const explorePublico = repositorios.filter((r) => {
      const relaciones = repositorioTags.filter(
        rt => rt.id_repositorio === r.id_repositorio
      );
      const repoTags = relaciones.map(rt =>
        tags.find(t => t.id_tag === rt.id_tag)
      );
      return (
        r.activo === true &&
        r.publico === true &&
        repoTags.some(t => t.slug === 'algebra')
      );
    });
    expect(explorePublico).toHaveLength(1);
    expect(explorePublico[0].titulo).toBe('Álgebra Básica');
    // 3. Actualizar publico=false
    repo.publico = false;

    expect(repo.publico).toBe(false);

    // 4. Explore nuevamente con tag algebra
    const explorePrivado = repositorios.filter((r) => {
      const relaciones = repositorioTags.filter(
        rt => rt.id_repositorio === r.id_repositorio
      );

      const repoTags = relaciones.map(rt =>
        tags.find(t => t.id_tag === rt.id_tag)
      );
      return (
        r.activo === true &&
        r.publico === true &&
        repoTags.some(t => t.slug === 'algebra')
      );
    });
    expect(explorePrivado).toHaveLength(0);
  });
});