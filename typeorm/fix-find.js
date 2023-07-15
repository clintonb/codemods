/**
 * Updates calls to findOne.
 *
 * Replace find(FindManyConditions) with findBy(FindManyOptionsWhere).
 *
 * @note Use a regex to update find(string).
 */
module.exports = function (fileInfo, api, options) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  return root
    .find(j.CallExpression)
    .filter((p) => p?.node?.callee?.property?.name === 'find')
    .replaceWith((nodePath) => {
      const { node } = nodePath;

      // Ignore non-TypeORM methods
      let optionsArgument = node.arguments[0];
      if (optionsArgument.type !== j.ObjectExpression.toString()) {
        return node;
      }

      // Ignore if the method already has FindManyOptions
      let findManyOptionsProperty = optionsArgument.properties.find((p) => {
        let name = p.key.name;
        const keys = [
          'where',
          'select',
          'relations',
          'order',
          'cache',
          'join',
          'skip',
          'take',
        ];
        return keys.indexOf(name) >= 0;
      });
      if (!findManyOptionsProperty) {
        node.callee.property.name = 'findBy';
      }

      return node;
    })
    .toSource();
};
