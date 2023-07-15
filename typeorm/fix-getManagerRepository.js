/**
 * Replaces imports of getManager and getRepository from 'typeorm' with imports from a centralized location.
 *
 * Centralizing these methods helps avoid the proliferation of dataSource imports across the codebase.
 */
const { pull } = require('lodash');

module.exports = function (fileInfo, api, options) {
  /**
   * New import path.
   *
   * @type {string}
   *
   * @example '@company-name/providers/database';
   */
  const NEW_IMPORT_LOCATION = 'REPLACE-ME'

  const j = api.jscodeshift;
  let root = j(fileInfo.source);

  const typeOrmImportDeclaration = root
    .find(j.ImportDeclaration)
    .filter((p) => {
      return p?.value?.source?.value === 'typeorm';
    });
  const importSpecifiers = typeOrmImportDeclaration
    .find(j.ImportSpecifier)
    .filter((p) => {
      return (
        p?.node?.imported?.name === 'getManager' ||
        p?.node?.imported?.name === 'getRepository'
      );
    });

  // Skip if there are no imports of getManager or getRepository from typeorm
  if (importSpecifiers.length < 1) {
    return j.skip;
  }

  const remainingTypeOrmImports = pull(
    importSpecifiers
      .get(0)
      .parentPath.parentPath.value.map((p) => p?.imported?.name),
    'getManager',
    'getRepository'
  );

  let source;
  if (remainingTypeOrmImports.length > 0) {
    // Remove the entire import statement if we are clearing all typeorm import declarations
    source = importSpecifiers.remove().toSource();
  } else {
    // Only remove the getManager or getRepository imports
    source = typeOrmImportDeclaration.remove().toSource();
  }

  root = j(source);

  let wrappedImport = j.importDeclaration.from({
    importKind: 'value',
    source: j.stringLiteral.from({
      value: NEW_IMPORT_LOCATION,
    }),
    specifiers: [
      j.importSpecifier.from({
        imported: j.identifier.from({ name: 'getManager' }),
      }),
      j.importSpecifier.from({
        imported: j.identifier.from({ name: 'getRepository' }),
      }),
    ],
  });

  // NOTE: This will screw up interpreter directives. Fix with search-and-replace
  root.get().node.program.body.unshift(wrappedImport);

  return root.toSource();
};
