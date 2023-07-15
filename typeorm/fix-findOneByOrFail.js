/**
 * Fixes findOneByOrFail() arguments
 */
module.exports = function (fileInfo, api, options) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  return root
    .find(j.CallExpression)
    .filter((p) => p?.node?.callee?.property?.name === 'findOneByOrFail')
    .replaceWith((nodePath) => {
      const { node } = nodePath;

      // Ignore non-TypeORM methods
      let optionsArgument = node.arguments[0];
      if (optionsArgument.type !== j.ObjectExpression.toString()) {
        return node;
      }

      // We only need to fix cases with a where property
      let whereProperty = optionsArgument.properties.find(
        (p) => p.key.name === 'where'
      );
      if (whereProperty) {
        node.callee.property.name = 'findOneOrFail';
      }

      return node;
    })
    .toSource();
};
