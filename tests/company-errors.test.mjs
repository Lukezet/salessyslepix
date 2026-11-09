import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { companyCreationError } from '../src/services/companyErrors.js';

test('explica sesión, permisos, validación y respuestas inciertas', () => {
  assert.match(companyCreationError({ response: { status: 401 } }), /sesión/);
  assert.match(companyCreationError({ response: { status: 403 } }), /permisos/);
  assert.equal(companyCreationError({ response: { status: 400, data: { message: 'Email registrado' } } }), 'Email registrado');
  assert.equal(companyCreationError({ response: { status: 400, data: { errors: { Name: ['Nombre obligatorio'] } } } }), 'Nombre obligatorio');
  assert.match(companyCreationError({}), /listado/);
  assert.ok(!companyCreationError({ response: { status: 500, data: { message: 'SQL secret' } } }).includes('SQL'));
});

async function service(post) {
  const context = vm.createContext({ URL, FormData, window: { location: { origin: 'https://example.test' } } });
  const api = new vm.SyntheticModule(['axiosClient'], function () { this.setExport('axiosClient', { post }); }, { context });
  const errors = new vm.SyntheticModule(['companyCreationError'], function () { this.setExport('companyCreationError', companyCreationError); }, { context });
  const module = new vm.SourceTextModule(await readFile(new URL('../src/services/companies.js', import.meta.url), 'utf8'), { context, initializeImportMeta(meta) { meta.env = {}; } });
  await module.link((name) => name.includes('axiosClient') ? api : errors);
  await module.evaluate();
  return module.namespace;
}

test('rechazo del servidor nunca se transforma en alta local', async () => {
  for (const status of [400, 401, 403, 500]) {
    const api = await service(async () => { throw { response: { status, data: { message: 'Email registrado' } } }; });
    await assert.rejects(api.createPlatformCompany({ name: 'Empresa', features: {} }),
      (error) => error.message === companyCreationError({ response: { status, data: { message: 'Email registrado' } } }));
  }
});

test('logo fallido conserva el alta confirmada sin volver a crear', async () => {
  let calls = 0;
  const api = await service(async () => {
    calls += 1;
    if (calls === 2) throw new Error('Upload fallido');
    return { data: { id: 42, name: 'Empresa', features: {} } };
  });
  const result = await api.createPlatformCompany({}, new Blob(['logo']));
  assert.equal(result.company.id, 42);
  assert.match(result.warning, /empresa se creó/);
  assert.equal(calls, 2);
});
