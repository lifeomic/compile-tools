import net from 'net';

export const getPort = async (): Promise<string> => {
  return await new Promise<string>((resolve, reject) => {
    try {
      const srv = net.createServer(() => {
      });
      srv.listen(0, () => {
        const port = (srv.address() as net.AddressInfo).port;
        srv.close((err) => reject(err));
        return resolve(`${port}`);
      });
    } catch (e) {
      reject(e);
    }
  });
};

if (require.main === module) {
  getPort()
    .then((port) => {
      process.stdout.write(`${port}`);
    })
    .catch((err) => {
      console.error(err);
      process.exit(-1);
    });
}
