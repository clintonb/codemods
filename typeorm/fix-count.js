/**
 * Fixes count() arguments
 */
module.exports = function (fileInfo, api, options) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  return root
    .find(j.CallExpression)
    .filter((p) => p?.node?.callee?.property?.name === 'count')
    .replaceWith((nodePath) => {
      const { node } = nodePath;

      // Ignore non-TypeORM methods
      let optionsArgument = node.arguments[0];
      if (optionsArgument.type !== j.ObjectExpression.toString()) {
        return node;
      }

      // Ignore method calls that have been fixed
      let whereProperty = optionsArgument.properties.find(
        (p) => p.key.name === 'where'
      );
      if (whereProperty) {
        return node;
      }

      const whereExpression = j.objectProperty.from({
        key: j.identifier('where'),
        value: optionsArgument,
      });
      node.arguments = [
        j.objectExpression.from({ properties: [whereExpression] }),
        ...node.arguments.slice(1),
      ];

      return node;
    })
    .toSource();
};
