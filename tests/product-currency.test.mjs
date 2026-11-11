import assert from 'node:assert/strict';
import { test } from 'node:test';
import { independentBlockEnabled, resolveModuleComponents } from '../src/services/componentModules.js';
import { newProductCurrency } from '../src/services/productCurrency.js';

test('sin cotizador de tienda el producto nuevo se envía en ARS aunque conserve USD en estado', () => {
  for (const features of [undefined, { store: true, components: { dollarQuote: false } },
    { store: true, components: { dollarQuote: true, 'placement:dollarQuote:realEstate': true } },
    { store: true, components: { dollarQuote: true, 'placement:dollarQuote:store': false } }]) {
    assert.equal(newProductCurrency(independentBlockEnabled(features, 'dollarQuote', 'store'), 1), 2);
  }
});

test('cotizador habilitado permite ambas monedas y conserva configuraciones anteriores', () => {
  for (const features of [{ store: true }, { store: true, components: { dollarQuote: true, 'placement:dollarQuote:store': true } }]) {
    const enabled = independentBlockEnabled(features, 'dollarQuote', 'store');
    assert.equal(newProductCurrency(enabled, 1), 1);
    assert.equal(newProductCurrency(enabled, 2), 2);
  }
});

test('quitar el cotizador por configuración general también fuerza ARS', () => {
  const features = { store: true, components: resolveModuleComponents({ dollarQuote: false, 'placement:dollarQuote:store': false }) };
  assert.equal(newProductCurrency(independentBlockEnabled(features, 'dollarQuote', 'store'), 1), 2);
});
