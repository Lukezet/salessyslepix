# Importación Excel de Tienda

Disponible en **Administración → Gestión de productos → Importar productos desde Excel**, cuando la empresa tiene habilitada Tienda.

1. Descargar **Modelo de Tienda**. Incluye Productos, Guía y las categorías, marcas, colores y tamaños actuales. Crear primero las categorías y marcas necesarias; luego recargar y descargar el modelo actualizado.
2. Reemplazar el ejemplo de Productos. Cada fila representa una variante. Repetir el código de la columna Producto y los datos generales para agrupar variantes del mismo producto. La primera variante será la principal. El código solo agrupa filas del archivo: no identifica un producto existente en la tienda.
3. Indicar categoría y marca mediante nombre o ID de las hojas de referencia. Color y tamaño son opcionales. Si hay nombres duplicados, usar IDs.
4. Usar precios numéricos sin separador de miles y moneda USD o ARS. Precio variante vacío hereda el precio general; cero se conserva.
5. Opcionalmente completar Fotos con nombres separados por `|` y adjuntar las imágenes JPG, PNG o WebP, sueltas o dentro de un ZIP. Los nombres deben ser únicos, incluso entre carpetas del ZIP.
6. Cargar la planilla (hasta 1000 filas), corregir los errores indicados e importar. La validación bloquea todo el lote si alguna fila es inválida.

La importación crea productos nuevos usando el servicio de catálogo existente, que mantiene los controles de empresa, autorización y módulo de la API. No actualiza productos ni administra cantidades de stock. Después de una respuesta exitosa, ese producto sale de la cola; los fallidos permanecen para reintentar. Si se corta la conexión, comprobar el catálogo antes de reintentar porque el servidor puede haber guardado el producto sin que la respuesta haya llegado. Recargar el archivo completo inicia otra importación y puede crear duplicados.

La plantilla de inmuebles no es compatible: su contrato representa publicaciones, operaciones y ubicaciones. En la revisión inicial, el diálogo de vehículos no ofrecía importación Excel.

## Verificación

- `node --test src/services/*.test.js src/components/guides/*.test.js`: 33 aprobadas, incluidas 10 de importación de Tienda.
- `npm run lint`: aprobado.
- `npm run build`: aprobado; aviso de tamaño del chunk de XLSX.
- API: `dotnet build LepixBack.sln` aprobado; `dotnet test LepixBack.Tests/LepixBack.Tests.csproj`: 80 aprobadas, 1 omitida (MySQL).

Las pruebas nuevas verifican una plantilla serializada a XLSX y leída nuevamente, rechazo de plantillas incompatibles, agrupación y consistencia de variantes, referencias, monedas, precios, filas vacías, fotos y ZIP, fallos de subida y resultados parciales. Las escrituras de catálogo se simulan; esta verificación no incluye una importación mediante navegador contra una base de datos real.
