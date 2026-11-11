// La moneda efectiva también se aplica al payload, aunque el estado conserve USD.
export function newProductCurrency(usdEnabled, selectedCurrency) {
  return usdEnabled ? selectedCurrency : 2;
}
