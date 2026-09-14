const fs = require('fs');
const path = require('path');

describe('TC-71-SIS-03 - Trazabilidad RQ71 con ResourceController / RepositoryController', () => {
  test('Existe soporte para recursos, pero no para recomendarlos en chat', () => {
    const resourceControllerPath = path.join(
      __dirname,
      '../../controllers/resourceController.js'
    );

    const resourceContent = fs.readFileSync(resourceControllerPath, 'utf8');

    expect(resourceContent).toContain('static async getById');
    expect(resourceContent).toContain('static async download');
    expect(resourceContent).toContain('static async create');

    expect(resourceContent.toLowerCase()).not.toContain('chat');
    expect(resourceContent.toLowerCase()).not.toContain('recommend');
    expect(resourceContent.toLowerCase()).not.toContain('recomendar');
    expect(resourceContent.toLowerCase()).not.toContain('grupo');
  });
});