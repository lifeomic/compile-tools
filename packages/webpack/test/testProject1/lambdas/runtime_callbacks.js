// eslint-disable-next-line require-await
exports.handler = async (event, context, callback) => {
  callback(null, 'one');
  // Returning from an async function is equivalent to invoking the callback.
  return 'two';
};
