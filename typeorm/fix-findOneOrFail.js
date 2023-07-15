/**
 * Fixes findOneOrFail() arguments
 */
module.exports = function (fileInfo, api, options) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  return root
    .find(j.CallExpression)
    .filter((p) => p?.node?.callee?.property?.name === 'findOneOrFail')
    .replaceWith((nodePath) => {
      const { node } = nodePath;
      const args = node.arguments;

      // No changes needed if the first argument is already an object
      if (args[0].type === j.ObjectExpression.toString()) {
        return node;
      }

      const idProperty = j.objectProperty.from({
        key: j.identifier('id'),
        value: args[0],
      });
      const whereExpression = j.objectProperty.from({
        key: j.identifier('where'),
        value: j.objectExpression.from({ properties: [idProperty] }),
      });

      // If we have two arguments, add the where property to the second;
      // otherwise, replace the first (and only) argument with a new property expression.
      if (args[1]) {
        // TODO Fix case where passed an object variable (which may contain a where property)
        args[1].properties = [whereExpression, ...args[1].properties];
        node.arguments = [args[1]];
      } else {
        node.arguments = [
          j.objectExpression.from({ properties: [whereExpression] }),
        ];
      }

      return node;
    })
    .toSource();
};
